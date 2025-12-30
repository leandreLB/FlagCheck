import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Compter les utilisateurs parrainés
    const { data: referredUsers, error: countError } = await supabase
      .from('users')
      .select('user_id')
      .eq('referred_by', userId);

    if (countError) {
      console.error('Error counting referrals:', countError);
      return NextResponse.json({ error: 'Failed to count referrals' }, { status: 500 });
    }

    const referralCount = referredUsers?.length || 0;
    const remainingForReward = 3 - (referralCount % 3);

    // Vérifier si l'utilisateur a du Pro gratuit
    const { data: userData } = await supabase
      .from('users')
      .select('free_pro_until')
      .eq('user_id', userId)
      .single();

    const freeProUntil = userData?.free_pro_until || null;

    return NextResponse.json({
      referralCount,
      remainingForReward,
      freeProUntil,
    });
  } catch (error) {
    console.error('Error in GET /api/referral/stats:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

