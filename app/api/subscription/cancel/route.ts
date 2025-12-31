import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: Request) {
  try {
    if (!stripe) {
      console.error("Stripe is not initialized - STRIPE_SECRET_KEY missing");
      return NextResponse.json(
        { error: "Stripe configuration missing" },
        { status: 500 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer l'utilisateur et son subscription_id depuis Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("subscription_id, subscription_plan")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a un abonnement Pro actif
    if (user.subscription_plan !== "pro_monthly" && user.subscription_plan !== "pro_annual") {
      return NextResponse.json(
        { error: "No active Pro subscription to cancel" },
        { status: 400 }
      );
    }

    let subscriptionId = user.subscription_id;

    // Si le subscription_id n'est pas dans la base de données, essayer de le récupérer depuis Stripe
    if (!subscriptionId) {
      console.log("⚠️ Subscription ID not found in database, trying to find it in Stripe...");
      
      // Récupérer l'email de l'utilisateur depuis Clerk
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

      if (!userEmail) {
        return NextResponse.json(
          { error: "Unable to find your subscription. Please contact support with your email address." },
          { status: 400 }
        );
      }

      try {
        // Chercher le customer Stripe par email
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });

        if (customers.data.length === 0) {
          return NextResponse.json(
            { error: "No Stripe customer found for your email. Please contact support." },
            { status: 400 }
          );
        }

        const customer = customers.data[0];

        // Chercher les abonnements actifs de ce customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "active",
          limit: 10,
        });

        if (subscriptions.data.length === 0) {
          return NextResponse.json(
            { error: "No active subscription found in Stripe. Your account may already be cancelled." },
            { status: 400 }
          );
        }

        // Prendre le premier abonnement actif (normalement il n'y en a qu'un)
        subscriptionId = subscriptions.data[0].id;
        
        console.log("✅ Found subscription in Stripe:", subscriptionId);
        
        // Mettre à jour la base de données avec le subscription_id trouvé
        await supabase
          .from("users")
          .update({ subscription_id: subscriptionId })
          .eq("user_id", userId);

      } catch (stripeError) {
        console.error("Error finding subscription in Stripe:", stripeError);
        return NextResponse.json(
          { error: "Unable to find your subscription in Stripe. Please contact support." },
          { status: 500 }
        );
      }
    }

    // Annuler l'abonnement Stripe
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    // Mettre à jour le statut dans Supabase
    // Note: Le webhook customer.subscription.deleted mettra aussi à jour le statut,
    // mais on le fait ici pour une réponse immédiate
    const { error: updateError } = await supabase
      .from("users")
      .update({
        subscription_plan: "free",
        subscription_id: null,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating user status:", updateError);
      // Ne pas retourner d'erreur car l'abonnement Stripe est déjà annulé
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Subscription cancelled successfully",
        subscription: {
          id: subscription.id,
          status: subscription.status,
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    let message = "Server error";
    
    if (err instanceof Stripe.errors.StripeError) {
      message = `Stripe error: ${err.message}`;
    } else if (err instanceof Error) {
      message = err.message;
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

