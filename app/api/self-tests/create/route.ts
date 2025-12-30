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

    console.log('Creating self test with data:', {
      userId,
      testId,
      date,
      scores,
      answersLength: answers.length,
    });

    const insertData = {
      user_id: userId,
      testid: testId, // Utiliser testid (minuscules) pour correspondre à la colonne PostgreSQL
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
    };

    console.log('Insert data:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('self_tests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating self test:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Vérifier si c'est une erreur de table manquante
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please run the SQL script to create the self_tests table.',
            details: 'The self_tests table does not exist in your Supabase database. Please execute the SQL script in create_self_tests_table.sql'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create self test', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testId: data.testid || data.testId, // Support les deux formats pour compatibilité
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

