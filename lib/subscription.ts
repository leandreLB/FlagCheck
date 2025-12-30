import { supabase } from "./supabase";

export type SubscriptionPlan = "free" | "pro_monthly" | "pro_annual";

export interface UserSubscription {
  plan: SubscriptionPlan;
  scansRemaining: number | null; // null = unlimited for Pro users
  freeScansRemaining?: number; // For free users
  subscriptionStartDate?: string;
  nextBillingDate?: string;
  freeProUntil?: string; // For referral bonuses
}

const MAX_FREE_SCANS = 3;

/**
 * Vérifie si un utilisateur a accès aux fonctionnalités Pro
 * Prend en compte le plan actif et le freeProUntil pour les bonus de parrainage
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("subscription_plan, free_pro_until")
      .eq("user_id", userId)
      .single();

    if (error || !user) {
      return false;
    }

    // Si l'utilisateur a un plan Pro, il a accès
    if (user.subscription_plan === "pro_monthly" || user.subscription_plan === "pro_annual") {
      return true;
    }

    // Si l'utilisateur a du temps Pro gratuit (parrainage), vérifier la date
    if (user.free_pro_until) {
      const freeUntilDate = new Date(user.free_pro_until);
      const now = new Date();
      if (freeUntilDate > now) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking Pro access:", error);
    return false;
  }
}

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
      .select("subscription_plan, free_scans_remaining, subscription_start_date, next_billing_date, free_pro_until")
      .eq("user_id", userId)
      .single();

    // Si l'utilisateur n'existe pas dans la table users, il est considéré comme 'free'
    let subscriptionPlan: SubscriptionPlan = "free";
    let freeScansRemaining = MAX_FREE_SCANS;
    let subscriptionStartDate: string | undefined;
    let nextBillingDate: string | undefined;
    let freeProUntil: string | undefined;

    if (!userError && user) {
      // Utiliser subscription_plan (nouveau champ)
      const plan = user.subscription_plan as string;
      
      // Déterminer le plan
      if (plan === "pro_monthly" || plan === "pro_annual") {
        subscriptionPlan = plan as SubscriptionPlan;
      } else {
        subscriptionPlan = "free";
      }

      // Récupérer les scans restants pour les utilisateurs gratuits
      if (subscriptionPlan === "free") {
        freeScansRemaining = user.free_scans_remaining ?? MAX_FREE_SCANS;
      }

      subscriptionStartDate = user.subscription_start_date;
      nextBillingDate = user.next_billing_date;
      freeProUntil = user.free_pro_until;
    }

    // Si l'utilisateur a un abonnement Pro ou du temps Pro gratuit, scans illimités
    const hasPro = await hasProAccess(userId);
    if (hasPro) {
      return {
        plan: subscriptionPlan,
        scansRemaining: null, // null = unlimited
        subscriptionStartDate,
        nextBillingDate,
        freeProUntil,
      };
    }

    // Pour les utilisateurs gratuits, retourner les scans restants
    return {
      plan: "free",
      scansRemaining: freeScansRemaining,
      freeScansRemaining,
    };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    // En cas d'erreur, on assume que l'utilisateur est gratuit avec tous ses scans
    return {
      plan: "free",
      scansRemaining: MAX_FREE_SCANS,
      freeScansRemaining: MAX_FREE_SCANS,
    };
  }
}

/**
 * Décrémente le nombre de scans gratuits restants pour un utilisateur
 */
export async function decrementFreeScans(userId: string): Promise<number> {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("free_scans_remaining")
      .eq("user_id", userId)
      .single();

    if (error || !user) {
      console.error("Error fetching user for scan decrement:", error);
      return 0;
    }

    const currentScans = user.free_scans_remaining ?? MAX_FREE_SCANS;
    const newScans = Math.max(0, currentScans - 1);

    await supabase
      .from("users")
      .update({ free_scans_remaining: newScans })
      .eq("user_id", userId);

    return newScans;
  } catch (error) {
    console.error("Error decrementing free scans:", error);
    return 0;
  }
}










