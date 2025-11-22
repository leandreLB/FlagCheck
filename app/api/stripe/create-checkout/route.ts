import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

export const runtime = "nodejs";

// Vérifier que la clé Stripe est configurée
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY n'est pas configurée dans les variables d'environnement");
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: Request) {
  try {
    // Check that Stripe is initialized
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

    const { priceType } = await request.json();

    if (!priceType || (priceType !== "monthly" && priceType !== "lifetime")) {
      return NextResponse.json(
        { error: "priceType must be 'monthly' or 'lifetime'" },
        { status: 400 }
      );
    }

    // Get user email from Clerk
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    // Déterminer le price ID selon le type
    // Utiliser trim() pour enlever les espaces et vérifier que ce n'est pas vide
    const monthlyPriceIdRaw = process.env.STRIPE_MONTHLY_PRICE_ID?.trim();
    const lifetimePriceIdRaw = process.env.STRIPE_LIFETIME_PRICE_ID?.trim();
    
    const priceId =
      priceType === "monthly"
        ? (monthlyPriceIdRaw && monthlyPriceIdRaw.length > 0 ? monthlyPriceIdRaw : undefined)
        : (lifetimePriceIdRaw && lifetimePriceIdRaw.length > 0 ? lifetimePriceIdRaw : undefined);

    // Logs de débogage pour vérifier les variables d'environnement
    console.log("Price Type:", priceType);
    console.log("STRIPE_MONTHLY_PRICE_ID (raw):", process.env.STRIPE_MONTHLY_PRICE_ID ? `"${process.env.STRIPE_MONTHLY_PRICE_ID}"` : "undefined");
    console.log("STRIPE_LIFETIME_PRICE_ID (raw):", process.env.STRIPE_LIFETIME_PRICE_ID ? `"${process.env.STRIPE_LIFETIME_PRICE_ID}"` : "undefined");
    console.log("STRIPE_MONTHLY_PRICE_ID (trimmed):", monthlyPriceIdRaw ? `✓ "${monthlyPriceIdRaw.substring(0, 20)}..."` : "✗ Manquant ou vide");
    console.log("STRIPE_LIFETIME_PRICE_ID (trimmed):", lifetimePriceIdRaw ? `✓ "${lifetimePriceIdRaw.substring(0, 20)}..."` : "✗ Manquant ou vide");
    console.log("Price ID sélectionné:", priceId ? `${priceId.substring(0, 20)}...` : "✗ Non défini");
    
    // Vérifier toutes les variables Stripe disponibles
    console.log("Variables Stripe disponibles:", {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "✓ Présent" : "✗ Absent",
      STRIPE_MONTHLY_PRICE_ID: monthlyPriceIdRaw ? "✓ Présent" : "✗ Absent",
      STRIPE_LIFETIME_PRICE_ID: lifetimePriceIdRaw ? "✓ Présent" : "✗ Absent",
    });

    if (!priceId) {
      const missingVar = priceType === "monthly" ? "STRIPE_MONTHLY_PRICE_ID" : "STRIPE_LIFETIME_PRICE_ID";
      console.error(`Missing environment variable: ${missingVar}`);
      return NextResponse.json(
        { 
          error: `Price ID not configured for this subscription type. Missing variable: ${missingVar}`,
          debug: {
            priceType,
            monthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID ? "present" : "absent",
            lifetimePriceId: process.env.STRIPE_LIFETIME_PRICE_ID ? "present" : "absent"
          }
        },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: priceType === "monthly" ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile`,
      metadata: {
        userId,
        priceType,
      },
    };

    // For subscriptions, add metadata in subscription_data
    if (priceType === "monthly") {
      sessionParams.subscription_data = {
        metadata: {
          userId,
          priceType,
        },
      };
    } else {
      // For one-time payments, add metadata in payment_intent_data
      sessionParams.payment_intent_data = {
        metadata: {
          userId,
          priceType,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      console.error("Stripe did not return a session URL");
      return NextResponse.json(
        { error: "Session URL not generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error("Error creating checkout:", err);
    let message = "Server error";
    
    if (err instanceof Stripe.errors.StripeError) {
      message = `Stripe error: ${err.message}`;
    } else if (err instanceof Error) {
      message = err.message;
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

