import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

// Générer un code unique de 6 caractères alphanumériques en majuscules
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer le code existant ou en générer un nouveau
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('referral_code')
      .eq('user_id', userId)
      .maybeSingle();

    // Si erreur autre que "pas trouvé" (PGRST116 = not found), retourner l'erreur
    // Mais aussi vérifier si c'est une erreur de colonne manquante
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      console.error('Error code:', fetchError.code);
      console.error('Error message:', fetchError.message);
      console.error('Error details:', fetchError.details);
      console.error('Error hint:', fetchError.hint);
      
      // Si c'est une erreur de colonne manquante, donner un message plus clair
      if (fetchError.message?.includes('referral_code') || fetchError.message?.includes('column') || fetchError.code === '42703') {
        return NextResponse.json({ 
          error: 'Referral code column not found. Please run the SQL migration script.',
          details: 'The referral_code column needs to be added to the users table. See add_referral_columns.sql'
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch user',
        details: fetchError.message,
        code: fetchError.code
      }, { status: 500 });
    }

    let referralCode = existingUser?.referral_code;

    // Si l'utilisateur n'a pas de code, en générer un unique
    if (!referralCode) {
      let attempts = 0;
      let codeIsUnique = false;
      let newCode = '';

      // Essayer de générer un code unique (max 20 tentatives pour plus de sécurité)
      while (!codeIsUnique && attempts < 20) {
        newCode = generateReferralCode();
        
        // Vérifier si ce code existe déjà en comptant les occurrences
        const { count, error: checkError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('referral_code', newCode);

        // Si pas d'erreur et aucun utilisateur avec ce code (count === 0)
        if (!checkError && count === 0) {
          codeIsUnique = true;
          referralCode = newCode;
        }
        attempts++;
      }

      if (!codeIsUnique || !referralCode) {
        console.error('Failed to generate unique referral code after', attempts, 'attempts');
        return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
      }

      // Vérifier si l'utilisateur existe déjà
      const { data: userExists } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      let upsertError;
      
      if (userExists) {
        // L'utilisateur existe, faire un update
        const { error } = await supabase
          .from('users')
          .update({ referral_code: referralCode })
          .eq('user_id', userId);
        upsertError = error;
      } else {
        // L'utilisateur n'existe pas, créer avec juste user_id et referral_code
        // Les autres champs seront NULL ou auront leurs valeurs par défaut
        const { error } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            referral_code: referralCode,
          });
        upsertError = error;
      }

      if (upsertError) {
        console.error('Error saving referral code:', upsertError);
        console.error('Error code:', upsertError.code);
        console.error('Error message:', upsertError.message);
        console.error('Error details:', upsertError.details);
        console.error('Error hint:', upsertError.hint);
        // Si l'erreur est due à un code dupliqué (violation de contrainte unique)
        if (upsertError.code === '23505' || upsertError.message?.includes('unique') || upsertError.message?.includes('duplicate')) {
          console.log('Code already exists (race condition), generating new one...');
          // Générer un nouveau code et réessayer (c'est rare mais possible en cas de race condition)
          const retryCode = generateReferralCode();
          const { count: retryCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('referral_code', retryCode);
          
          if (retryCount === 0) {
            // Essayer de faire un update ou insert
            const { data: userExistsRetry } = await supabase
              .from('users')
              .select('user_id')
              .eq('user_id', userId)
              .maybeSingle();

            let retryError;
            if (userExistsRetry) {
              const { error } = await supabase
                .from('users')
                .update({ referral_code: retryCode })
                .eq('user_id', userId);
              retryError = error;
            } else {
              const { error } = await supabase
                .from('users')
                .insert({
                  user_id: userId,
                  referral_code: retryCode,
                });
              retryError = error;
            }
            
            if (!retryError) {
              referralCode = retryCode;
            } else {
              return NextResponse.json({ 
                error: 'Failed to save referral code after retry',
                details: retryError.message,
                code: retryError.code
              }, { status: 500 });
            }
          } else {
            return NextResponse.json({ 
              error: 'Failed to generate unique referral code',
              details: 'Please try again'
            }, { status: 500 });
          }
        } else {
          // Si c'est une erreur de colonne manquante, donner un message plus clair
          if (upsertError.message?.includes('referral_code') || upsertError.message?.includes('column') || upsertError.code === '42703') {
            return NextResponse.json({ 
              error: 'Referral code column not found. Please run the SQL migration script.',
              details: 'The referral_code column needs to be added to the users table. See add_referral_columns.sql',
              code: upsertError.code
            }, { status: 500 });
          }
          
          return NextResponse.json({ 
            error: 'Failed to save referral code',
            details: upsertError.message,
            code: upsertError.code,
            hint: upsertError.hint
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ referralCode });
  } catch (error) {
    console.error('Error in GET /api/referral/my-code:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    const errorDetails = error instanceof Error ? { 
      message: error.message,
      stack: error.stack 
    } : {};
    return NextResponse.json({ 
      error: message,
      ...errorDetails
    }, { status: 500 });
  }
}

