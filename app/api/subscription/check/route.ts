import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSubscription } from "@/lib/subscription";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(userId);
    // Retourner un format compatible avec l'ancien code (pour migration progressive)
    return NextResponse.json({
      status: subscription.plan === "free" ? "free" : "pro",
      plan: subscription.plan,
      scansRemaining: subscription.scansRemaining,
      freeScansRemaining: subscription.freeScansRemaining,
      subscriptionStartDate: subscription.subscriptionStartDate,
      nextBillingDate: subscription.nextBillingDate,
      freeProUntil: subscription.freeProUntil,
    }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}





