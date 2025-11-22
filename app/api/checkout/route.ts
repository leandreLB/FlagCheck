import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// ⚠️ NOTE: Cette API nécessite l'installation de Stripe
// npm install stripe
// et la configuration de STRIPE_SECRET_KEY dans les variables d'environnement

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || (plan !== 'pro' && plan !== 'lifetime')) {
      return NextResponse.json(
        { error: "Plan invalide" },
        { status: 400 }
      );
    }

    // ⚠️ TODO: Intégrer Stripe Checkout
    // Exemple d'implémentation (nécessite stripe package):
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const priceId = plan === 'pro' 
      ? process.env.STRIPE_PRO_PRICE_ID 
      : process.env.STRIPE_LIFETIME_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      mode: plan === 'pro' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail, // Récupérer depuis Clerk
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/results/${scanId}`,
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
    */

    // Pour l'instant, retourner une URL de placeholder
    // Remplacez ceci par l'intégration Stripe réelle
    return NextResponse.json(
      { 
        error: "Stripe non configuré",
        message: "Please configure Stripe to enable payments",
        // url: session.url // Uncomment when Stripe is configured
      },
      { status: 501 }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    const message =
      err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}







