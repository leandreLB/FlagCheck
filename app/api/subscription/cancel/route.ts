import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
      .select("subscription_id, subscription_status")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a un abonnement Pro actif
    if (user.subscription_status !== "pro") {
      return NextResponse.json(
        { error: "No active Pro subscription to cancel" },
        { status: 400 }
      );
    }

    if (!user.subscription_id) {
      return NextResponse.json(
        { error: "Subscription ID not found" },
        { status: 400 }
      );
    }

    // Récupérer l'abonnement actuel pour obtenir la date de fin de période
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id);

    // Annuler l'abonnement à la fin de la période de facturation (meilleure pratique)
    // Cela permet à l'utilisateur de continuer à utiliser le service jusqu'à la fin de la période payée
    await stripe.subscriptions.update(user.subscription_id, {
      cancel_at_period_end: true,
    });

    // Récupérer l'abonnement mis à jour pour obtenir les informations finales
    const updatedSubscription = await stripe.subscriptions.retrieve(user.subscription_id);

    // Note: Le statut reste "pro" jusqu'à la fin de la période
    // Le webhook customer.subscription.deleted mettra à jour le statut quand l'abonnement sera réellement annulé
    // On pourrait mettre à jour une colonne subscription_cancelled_at_period_end si elle existe,
    // mais pour l'instant on laisse le webhook gérer la transition finale

    // Calculer la date de fin de période
    const periodEnd = new Date(updatedSubscription.current_period_end * 1000);
    const periodEndFormatted = periodEnd.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Subscription will be cancelled at the end of your billing period",
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          current_period_end: updatedSubscription.current_period_end,
          period_end_formatted: periodEndFormatted,
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

