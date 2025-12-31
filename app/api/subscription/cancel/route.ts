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

    // Annuler l'abonnement Stripe
    const subscription = await stripe.subscriptions.cancel(user.subscription_id);

    // Mettre à jour le statut dans Supabase
    // Note: Le webhook customer.subscription.deleted mettra aussi à jour le statut,
    // mais on le fait ici pour une réponse immédiate
    const { error: updateError } = await supabase
      .from("users")
      .update({
        subscription_status: "free",
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

