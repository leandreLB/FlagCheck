import { supabase } from '@/lib/supabase';
import { SelfTest, SelfTestScores, QuestionAnswer, CategoryScores } from '@/lib/types/selfTest.types';

// Mapping des questions aux catégories
// Communication: 8, 10
// Boundaries: 4, 6
// Attachment: 2, 3
// Honesty: 9, 12
// Toxic behaviors: 1, 5, 7, 11
const QUESTION_CATEGORY_MAP: Record<number, keyof CategoryScores> = {
  1: 'toxic',
  2: 'attachment',
  3: 'attachment',
  4: 'boundaries',
  5: 'toxic',
  6: 'boundaries',
  7: 'toxic',
  8: 'communication',
  9: 'honesty',
  10: 'communication',
  11: 'toxic',
  12: 'honesty',
};

/**
 * Calcule les scores de catégories et le score total à partir des réponses
 */
export function calculateScore(answers: QuestionAnswer[]): SelfTestScores {
  if (answers.length !== 12) {
    throw new Error('Answers array must contain exactly 12 answers');
  }

  // Initialiser les scores par catégorie
  const categorySums: CategoryScores = {
    communication: 0,
    boundaries: 0,
    attachment: 0,
    honesty: 0,
    toxic: 0,
  };

  const categoryCounts: CategoryScores = {
    communication: 0,
    boundaries: 0,
    attachment: 0,
    honesty: 0,
    toxic: 0,
  };

  // Calculer la somme des scores par catégorie
  answers.forEach((answer, index) => {
    const questionNumber = index + 1;
    const category = QUESTION_CATEGORY_MAP[questionNumber];
    
    if (category) {
      categorySums[category] += answer;
      categoryCounts[category] += 1;
    }
  });

  // Calculer la moyenne par catégorie, puis convertir sur 10
  const categoryScores: CategoryScores = {
    communication: categoryCounts.communication > 0 
      ? (categorySums.communication / categoryCounts.communication / 5) * 10 
      : 0,
    boundaries: categoryCounts.boundaries > 0 
      ? (categorySums.boundaries / categoryCounts.boundaries / 5) * 10 
      : 0,
    attachment: categoryCounts.attachment > 0 
      ? (categorySums.attachment / categoryCounts.attachment / 5) * 10 
      : 0,
    honesty: categoryCounts.honesty > 0 
      ? (categorySums.honesty / categoryCounts.honesty / 5) * 10 
      : 0,
    toxic: categoryCounts.toxic > 0 
      ? (categorySums.toxic / categoryCounts.toxic / 5) * 10 
      : 0,
  };

  // Calculer le score total (moyenne des 5 catégories)
  const total = (
    categoryScores.communication +
    categoryScores.boundaries +
    categoryScores.attachment +
    categoryScores.honesty +
    categoryScores.toxic
  ) / 5;

  return {
    communication: Math.round(categoryScores.communication * 10) / 10,
    boundaries: Math.round(categoryScores.boundaries * 10) / 10,
    attachment: Math.round(categoryScores.attachment * 10) / 10,
    honesty: Math.round(categoryScores.honesty * 10) / 10,
    toxic: Math.round(categoryScores.toxic * 10) / 10,
    total: Math.round(total * 10) / 10,
  };
}

/**
 * Sauvegarde un test dans Firestore
 */
export async function saveSelfTest(
  userId: string,
  answers: QuestionAnswer[]
): Promise<SelfTest> {
  const scores = calculateScore(answers);
  const testId = crypto.randomUUID();
  const date = new Date().toISOString();

  const { data, error } = await supabase
    .from('self_tests')
    .insert({
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
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving self test:', error);
    throw new Error(`Failed to save self test: ${error.message}`);
  }

  return {
    testId: data.testid || data.testId, // Support les deux formats pour compatibilité
    date: data.date,
    scores: data.scores as SelfTestScores,
    answers: data.answers as QuestionAnswer[],
    completed: data.completed,
  };
}

/**
 * Récupère les derniers tests avec une limite optionnelle (par défaut 6)
 */
export async function getSelfTests(
  userId: string,
  limit: number = 6
): Promise<SelfTest[]> {
  const { data, error } = await supabase
    .from('self_tests')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching self tests:', error);
    throw new Error(`Failed to fetch self tests: ${error.message}`);
  }

  return (data || []).map((test) => ({
    testId: test.testid || test.testId, // Support les deux formats pour compatibilité
    date: test.date,
    scores: test.scores as SelfTestScores,
    answers: test.answers as QuestionAnswer[],
    completed: test.completed,
  }));
}

/**
 * Récupère uniquement le dernier score
 */
export async function getLatestScore(
  userId: string
): Promise<SelfTest | null> {
  const { data, error } = await supabase
    .from('self_tests')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching latest score:', error);
    throw new Error(`Failed to fetch latest score: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    testId: data.testid || data.testId, // Support les deux formats pour compatibilité
    date: data.date,
    scores: data.scores as SelfTestScores,
    answers: data.answers as QuestionAnswer[],
    completed: data.completed,
  };
}

/**
 * Vérifie si l'utilisateur peut faire un test (limite mensuelle pour les gratuits)
 */
export async function canTakeTest(
  userId: string,
  subscriptionStatus: 'free' | 'pro' | 'lifetime'
): Promise<boolean> {
  // Les utilisateurs Pro et Lifetime ont des tests illimités
  if (subscriptionStatus === 'pro' || subscriptionStatus === 'lifetime') {
    return true;
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
    return true;
  }

  // Si aucun test ce mois-ci, on peut faire un test
  return (data?.length || 0) === 0;
}

