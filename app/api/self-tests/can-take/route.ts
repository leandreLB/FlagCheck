import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { getUserSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer le statut d'abonnement
    const subscription = await getUserSubscription(userId);

    // Les utilisateurs Pro ont des tests illimités
    if (subscription.plan === 'pro_monthly' || subscription.plan === 'pro_annual') {
      return NextResponse.json({ canTake: true });
    }

    // Pour les utilisateurs gratuits, vérifier s'ils ont déjà fait un test ce mois-ci
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthISO = startOfMonth.toISOString();

    const { data, error } = await supabase
      .from('self_tests')
      .select('testid') // Utiliser testid (minuscules) pour correspondre à la colonne PostgreSQL
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', startOfMonthISO)
      .limit(1);

    if (error) {
      console.error('Error checking test limit:', error);
      // En cas d'erreur, on permet le test
      return NextResponse.json({ canTake: true });
    }

    // Si aucun test ce mois-ci, on peut faire un test
    const canTake = (data?.length || 0) === 0;
    return NextResponse.json({ canTake });
  } catch (error) {
    console.error('Error in GET /api/self-tests/can-take:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

