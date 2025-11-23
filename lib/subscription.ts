import { supabase } from "./supabase";

export type SubscriptionStatus = "free" | "pro" | "lifetime";

export interface UserSubscription {
  status: SubscriptionStatus;
  scansRemaining: number | null; // null = unlimited
}

const MAX_FREE_SCANS = 3;

/**
 * Récupère le statut d'abonnement et le nombre de scans restants pour un utilisateur
 * @param userId - L'ID de l'utilisateur Clerk
 * @returns Le statut d'abonnement et le nombre de scans restants
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  try {
    // Récupérer le statut d'abonnement depuis la table users
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("subscription_status")
      .eq("user_id", userId)
      .single();

    // Si l'utilisateur n'existe pas dans la table users, il est considéré comme 'free'
    let subscriptionStatus: SubscriptionStatus = "free";
    if (!userError && user?.subscription_status) {
      const status = user.subscription_status as string;
      if (status === "pro" || status === "lifetime") {
        subscriptionStatus = status as SubscriptionStatus;
      }
    }

    // Si l'utilisateur a un abonnement pro ou lifetime, scans illimités
    if (subscriptionStatus === "pro" || subscriptionStatus === "lifetime") {
      return {
        status: subscriptionStatus,
        scansRemaining: null, // null = unlimited
      };
    }

    // Pour les utilisateurs gratuits, calculer les scans restants
    const { data: scans, error: scansError } = await supabase
      .from("scans")
      .select("id")
      .eq("user_id", userId);

    if (scansError) {
      console.error("Erreur lors de la récupération des scans:", scansError);
      // En cas d'erreur, on assume que l'utilisateur a encore tous ses scans
      return {
        status: "free",
        scansRemaining: MAX_FREE_SCANS,
      };
    }

    const usedScans = scans?.length || 0;
    const scansRemaining = Math.max(0, MAX_FREE_SCANS - usedScans);

    return {
      status: "free",
      scansRemaining,
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de l'abonnement:", error);
    // En cas d'erreur, on assume que l'utilisateur est gratuit avec tous ses scans
    return {
      status: "free",
      scansRemaining: MAX_FREE_SCANS,
    };
  }
}







