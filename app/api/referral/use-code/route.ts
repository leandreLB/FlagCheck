import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const referralCode = code.toUpperCase().trim();

    // Vérifier que l'utilisateur n'a pas déjà utilisé un code
    const { data: currentUser } = await supabase
      .from('users')
      .select('referred_by')
      .eq('user_id', userId)
      .single();

    if (currentUser?.referred_by) {
      return NextResponse.json({ error: 'You have already used a referral code' }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'utilise pas son propre code
    const { data: userCode } = await supabase
      .from('users')
      .select('referral_code')
      .eq('user_id', userId)
      .single();

    if (userCode?.referral_code === referralCode) {
      return NextResponse.json({ error: 'You cannot use your own referral code' }, { status: 400 });
    }

    // Trouver le parrain avec ce code
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('user_id, referral_code')
      .eq('referral_code', referralCode)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Enregistrer que cet utilisateur a été parrainé
    const { error: updateError } = await supabase
      .from('users')
      .upsert(
        {
          user_id: userId,
          referred_by: referrer.user_id,
        },
        { onConflict: 'user_id' }
      );

    if (updateError) {
      console.error('Error updating referred_by:', updateError);
      return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 });
    }

    // Donner 3 jours de premium gratuit à l'utilisateur qui entre le code
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Vérifier si l'utilisateur a déjà du Pro gratuit
    const { data: userData } = await supabase
      .from('users')
      .select('free_pro_until')
      .eq('user_id', userId)
      .single();

    const currentFreeProUntil = userData?.free_pro_until
      ? new Date(userData.free_pro_until)
      : null;

    // Si la date actuelle est dans le futur, prolonger à partir de cette date
    // Sinon, commencer à partir de maintenant
    const newFreeProUntil =
      currentFreeProUntil && currentFreeProUntil > now
        ? new Date(currentFreeProUntil.getTime() + 3 * 24 * 60 * 60 * 1000)
        : threeDaysLater;

    // Mettre à jour free_pro_until pour l'utilisateur qui entre le code
    const { error: updateUserProError } = await supabase
      .from('users')
      .update({
        free_pro_until: newFreeProUntil.toISOString(),
      })
      .eq('user_id', userId);

    if (updateUserProError) {
      console.error('Error updating free_pro_until for user:', updateUserProError);
      // Ne pas faire échouer la requête si cette mise à jour échoue
    }

    // Compter les parrainés du parrain
    const { data: referredUsers, error: countError } = await supabase
      .from('users')
      .select('user_id')
      .eq('referred_by', referrer.user_id);

    if (countError) {
      console.error('Error counting referrals:', countError);
    }

    const referralCount = referredUsers?.length || 0;

    // Si le parrain a maintenant 3 parrainés (ou un multiple de 3), lui donner 1 semaine de Pro gratuit
    if (referralCount > 0 && referralCount % 3 === 0) {
      const now = new Date();
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Vérifier si le parrain a déjà du Pro gratuit
      const { data: referrerData } = await supabase
        .from('users')
        .select('free_pro_until')
        .eq('user_id', referrer.user_id)
        .single();

      const currentFreeProUntil = referrerData?.free_pro_until
        ? new Date(referrerData.free_pro_until)
        : null;

      // Si la date actuelle est dans le futur, prolonger à partir de cette date
      // Sinon, commencer à partir de maintenant
      const newFreeProUntil =
        currentFreeProUntil && currentFreeProUntil > now
          ? new Date(currentFreeProUntil.getTime() + 7 * 24 * 60 * 60 * 1000)
          : oneWeekLater;

      // Mettre à jour free_pro_until
      const { error: updateProError } = await supabase
        .from('users')
        .update({
          free_pro_until: newFreeProUntil.toISOString(),
        })
        .eq('user_id', referrer.user_id);

      if (updateProError) {
        console.error('Error updating free_pro_until:', updateProError);
      }
    }

    return NextResponse.json({ success: true, message: 'Referral code applied successfully' });
  } catch (error) {
    console.error('Error in POST /api/referral/use-code:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

