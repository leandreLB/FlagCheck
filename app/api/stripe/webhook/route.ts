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
  // Webhook updated to handle all payment scenarios
  
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

    // Handle checkout.session.completed (paiement réussi)
    // IMPORTANT: Nécessaire pour le plan Lifetime (paiement unique sans abonnement récurrent)
    // Si cet événement n'est pas disponible, le plan Lifetime ne fonctionnera pas automatiquement
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Les métadonnées peuvent être dans session.metadata OU dans subscription.metadata (pour monthly)
      // ou payment_intent.metadata (pour lifetime)
      let userId = session.metadata?.userId;
      let priceType = session.metadata?.priceType;
      
      // Si pas dans session.metadata, essayer de récupérer depuis subscription ou payment_intent
      if (!userId || !priceType) {
        // Pour les abonnements monthly, les métadonnées sont dans subscription_data
        if (session.subscription) {
          const subscriptionId = typeof session.subscription === "string" 
            ? session.subscription 
            : session.subscription.id;
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            userId = subscription.metadata?.userId || userId;
            priceType = subscription.metadata?.priceType || priceType;
          } catch (err) {
            console.error("Error retrieving subscription:", err);
          }
        }
        
        // Pour les paiements uniques lifetime, les métadonnées sont dans payment_intent
        if (session.payment_intent && (!userId || !priceType)) {
          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent.id;
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            userId = paymentIntent.metadata?.userId || userId;
            priceType = paymentIntent.metadata?.priceType || priceType;
          } catch (err) {
            console.error("Error retrieving payment intent:", err);
          }
        }
      }

      console.log("👤 userId:", userId);
      console.log("💳 priceType:", priceType);
      console.log("📋 Session metadata:", session.metadata);

      if (!userId) {
        console.error("❌ userId missing in metadata");
        return NextResponse.json(
          { error: "userId missing" },
          { status: 400 }
        );
      }

      if (!priceType || (priceType !== "monthly" && priceType !== "lifetime")) {
        console.error("❌ priceType invalide:", priceType);
        return NextResponse.json(
          { error: "priceType invalide" },
          { status: 400 }
        );
      }

      // Déterminer le statut d'abonnement
      // "monthly" = pro, "lifetime" = lifetime
      const subscriptionStatus = priceType === "monthly" ? "pro" : "lifetime";

      // Récupérer l'ID de l'abonnement si c'est Pro (subscription récurrente)
      let subscriptionId: string | null = null;
      if (priceType === "monthly" && session.subscription) {
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
    
    // Handle customer.subscription.updated (Pro subscription status changes)
    // Cet événement gère TOUS les changements d'abonnement, y compris la création et la suppression
    else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log("🔄 Subscription updated:", subscription.id, "Status:", subscription.status);

      // Chercher l'utilisateur par subscription_id
      let user = null;
      const { data: userBySubscription } = await supabase
        .from("users")
        .select("user_id, subscription_status")
        .eq("subscription_id", subscription.id)
        .single();

      if (userBySubscription) {
        user = userBySubscription;
      } else {
        // Si l'utilisateur n'est pas trouvé par subscription_id, c'est peut-être une nouvelle souscription
        // On ne peut pas l'activer automatiquement sans userId dans les métadonnées
        // Dans ce cas, on attend checkout.session.completed ou on ignore
        console.log("⚠️ User not found for subscription_id:", subscription.id);
        console.log("⚠️ Si c'est une nouvelle souscription, elle sera activée par checkout.session.completed");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Si l'utilisateur a un abonnement Lifetime, ne pas modifier son statut
      if (user.subscription_status === "lifetime") {
        console.log("✅ User has lifetime subscription, skipping update");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Vérifier le statut de l'abonnement Stripe
      // active = abonnement actif et payé
      // trialing = période d'essai
      // past_due = paiement en retard
      // unpaid = non payé
      // canceled = annulé (gère aussi les suppressions)
      // incomplete, incomplete_expired = paiement incomplet
      if (
        subscription.status === "active" ||
        subscription.status === "trialing"
      ) {
        // Abonnement actif, s'assurer que le statut est "pro"
        console.log("✅ Subscription is active, ensuring Pro status");
        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_status: "pro",
            subscription_id: subscription.id,
          })
          .eq("user_id", user.user_id);

        if (updateError) {
          console.error("❌ Update error:", updateError);
          return NextResponse.json(
            { error: "Update failed" },
            { status: 500 }
          );
        }
        console.log("✅ User status updated to Pro");
      } else if (
        subscription.status === "past_due" ||
        subscription.status === "unpaid" ||
        subscription.status === "canceled" ||
        subscription.status === "incomplete_expired"
      ) {
        // Paiement échoué, annulé ou supprimé, retirer l'accès Pro
        // Note: "canceled" gère aussi les suppressions (équivalent à customer.subscription.deleted)
        console.log("🚫 Subscription payment failed, canceled or deleted, removing Pro access");
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
        console.log("✅ User switched to free due to payment failure");
      }
    }
    
    // Handle customer.subscription.deleted (Pro subscription cancellation)
    // Note: customer.subscription.updated avec status="canceled" gère aussi les suppressions
    else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log("🚫 Subscription deleted:", subscription.id);

      // Get user by subscription_id
      const { data: user } = await supabase
        .from("users")
        .select("user_id, subscription_status")
        .eq("subscription_id", subscription.id)
        .single();

      if (!user) {
        console.log("⚠️ User not found for subscription_id:", subscription.id);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Si l'utilisateur a un abonnement Lifetime, ne pas modifier son statut
      if (user.subscription_status === "lifetime") {
        console.log("✅ User has lifetime subscription, skipping deletion");
        return NextResponse.json({ received: true }, { status: 200 });
      }

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
    }
    
    // Handle invoice.payment_failed (Payment failed for Pro subscription)
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.log("💳 Invoice payment failed:", invoice.id);

      // Si c'est une facture d'abonnement (subscription existe)
      // Dans Stripe, invoice.subscription peut être string | Stripe.Subscription | null
      const subscriptionValue = (invoice as any).subscription;
      const subscriptionId = subscriptionValue 
        ? (typeof subscriptionValue === "string" 
            ? subscriptionValue 
            : subscriptionValue.id)
        : null;

      if (subscriptionId) {

        // Get user by subscription_id
        const { data: user } = await supabase
          .from("users")
          .select("user_id, subscription_status")
          .eq("subscription_id", subscriptionId)
          .single();

        if (!user) {
          console.log("⚠️ User not found for subscription_id:", subscriptionId);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // Si l'utilisateur a un abonnement Lifetime, ne pas modifier son statut
        if (user.subscription_status === "lifetime") {
          console.log("✅ User has lifetime subscription, skipping payment failure");
          return NextResponse.json({ received: true }, { status: 200 });
        }

        console.log("🚫 Payment failed for Pro subscription, removing Pro access");
        
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
        
        console.log("✅ User switched to free due to payment failure");
      } else {
        console.log("⚠️ Invoice is not linked to a subscription, skipping");
        return NextResponse.json({ received: true }, { status: 200 });
      }
    }
    // Si l'événement n'est pas géré, logger un avertissement mais ne pas échouer
    else {
      console.log("⚠️ Event type not handled:", event.type);
      // Retourner success pour ne pas faire échouer le webhook
      // Stripe réessaiera si on retourne une erreur
      return NextResponse.json({ received: true, note: "Event type not handled" }, { status: 200 });
    }

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("💥 Webhook error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}