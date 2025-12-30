import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { calculateScore } from '@/lib/services/selfTestService';
import { QuestionAnswer } from '@/lib/types/selfTest.types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers } = await request.json();

    // Validation
    if (!Array.isArray(answers) || answers.length !== 12) {
      return NextResponse.json(
        { error: 'Answers must be an array of 12 numbers' },
        { status: 400 }
      );
    }

    // Vérifier que chaque réponse est entre 1 et 5
    for (const answer of answers) {
      if (typeof answer !== 'number' || answer < 1 || answer > 5) {
        return NextResponse.json(
          { error: 'Each answer must be a number between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Calculer les scores
    const scores = calculateScore(answers as QuestionAnswer[]);

    // Créer le test
    const testId = crypto.randomUUID();
    const date = new Date().toISOString();

    const { data, error } = await supabase
      .from('self_tests')
      .insert({
        user_id: userId,
        testId,
        date,
        scores: {
          communication: scores.communication,
          boundaries: scores.boundaries,
          attachment: scores.attachment,
          honesty: scores.honesty,
          toxic: scores.toxic,
          total: scores.total,
        },
        answers,
        completed: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating self test:', error);
      return NextResponse.json(
        { error: 'Failed to create self test', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testId: data.testId,
      date: data.date,
      scores: data.scores,
      answers: data.answers,
    });
  } catch (error) {
    console.error('Error in POST /api/self-tests/create:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

