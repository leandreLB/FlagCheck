import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  console.log("🪝 Webhook Stripe appelé");
  
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.log("❌ No signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature (skip in local if no secret)
    let event: Stripe.Event;
    
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log("✅ Signature verified");
      } catch (err) {
        console.error("❌ Signature verification error:", err);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    } else {
      // In local dev without webhook secret, parse directly
      console.log("⚠️ Dev mode: no signature verification");
      event = JSON.parse(body);
    }

    console.log("📨 Event type:", event.type);

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const priceType = session.metadata?.priceType; // "pro" or "lifetime"

      console.log("👤 userId:", userId);
      console.log("💳 priceType:", priceType);

      if (!userId) {
        console.error("❌ userId missing in metadata");
        return NextResponse.json(
          { error: "userId missing" },
          { status: 400 }
        );
      }

      if (!priceType || (priceType !== "pro" && priceType !== "lifetime")) {
        console.error("❌ priceType invalide:", priceType);
        return NextResponse.json(
          { error: "priceType invalide" },
          { status: 400 }
        );
      }

      // Déterminer le statut d'abonnement
      const subscriptionStatus = priceType === "pro" ? "pro" : "lifetime";

      // Récupérer l'ID de l'abonnement si c'est Pro (subscription récurrente)
      let subscriptionId: string | null = null;
      if (priceType === "pro" && session.subscription) {
        subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
      }

      console.log("💾 Sauvegarde dans Supabase...");
      console.log("   - subscription_status:", subscriptionStatus);
      console.log("   - subscription_id:", subscriptionId);

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", userId)
        .single();

      if (existingUser) {
        console.log("👤 User exists, updating...");
        
        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_status: subscriptionStatus,
            subscription_id: subscriptionId,
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("❌ Update error:", updateError);
          return NextResponse.json(
            { error: "Update failed" },
            { status: 500 }
          );
        }
        
        console.log("✅ User updated");
      } else {
        console.log("👤 New user, creating...");
        
        const { error: insertError } = await supabase.from("users").insert({
          user_id: userId,
          subscription_status: subscriptionStatus,
          subscription_id: subscriptionId,
        });

        if (insertError) {
          console.error("❌ Insertion error:", insertError);
          return NextResponse.json(
            { error: "Insertion failed" },
            { status: 500 }
          );
        }
        
        console.log("✅ User created");
      }
    } 
    
    // Handle customer.subscription.deleted (Pro subscription cancellation)
    else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log("🚫 Subscription cancellation:", subscription.id);

      // Get user by subscription_id
      const { data: user } = await supabase
        .from("users")
        .select("user_id")
        .eq("subscription_id", subscription.id)
        .single();

      if (user) {
        console.log("👤 User found, switching to free...");
        
        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_status: "free",
            subscription_id: null,
          })
          .eq("user_id", user.user_id);

        if (updateError) {
          console.error("❌ Update error:", updateError);
          return NextResponse.json(
            { error: "Update failed" },
            { status: 500 }
          );
        }
        
        console.log("✅ Subscription cancelled, user switched to free");
      } else {
        console.log("⚠️ User not found for subscription_id:", subscription.id);
      }
    }

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("💥 Webhook error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}