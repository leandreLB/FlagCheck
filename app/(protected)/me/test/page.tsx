'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { QUESTIONS, ANSWER_OPTIONS } from '@/lib/constants/questions';
import { QuestionAnswer } from '@/lib/types/selfTest.types';

type QuizState = 'intro' | 'quiz' | 'calculating' | 'results';

export default function SelfTestScreen() {
  const [currentState, setCurrentState] = useState<QuizState>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>(Array(12).fill(0) as QuestionAnswer[]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    // Vérifier si l'utilisateur peut faire le test
    const checkCanTake = async () => {
      if (!userId) {
        router.push('/sign-in');
        return;
      }

      const response = await fetch('/api/self-tests/can-take');
      if (response.ok) {
        const data = await response.json();
        if (!data.canTake) {
          // Rediriger vers le paywall
          router.push('/me?upgrade=true');
        }
      }
    };

    checkCanTake();
  }, [userId, router]);

  const handleAnswer = (value: QuestionAnswer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions sont répondues
    if (answers.some(answer => answer === 0)) {
      alert('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    setCurrentState('calculating');

    try {
      const response = await fetch('/api/self-tests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit test');
      }

      const data = await response.json();
      setResults(data);
      
      // Attendre un peu pour l'animation de calcul
      setTimeout(() => {
        setCurrentState('results');
      }, 2000);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
      setCurrentState('quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartQuiz = () => {
    setCurrentState('quiz');
    setCurrentQuestion(0);
  };

  const handleBackToMe = () => {
    router.push('/me');
  };

  // Écran d'introduction
  if (currentState === 'intro') {
    return (
      <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full min-h-screen">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
        </div>

        <div className="relative z-10 flex flex-col px-6 md:px-8 lg:px-12 pt-8 pb-8 animate-fade-in overflow-x-hidden w-full max-w-[600px] md:max-w-none mx-auto md:mx-0" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="mb-8 text-6xl">🪞</div>
            <h1 className="text-4xl font-bold text-white mb-6 text-center">
              Am I a red flag?
            </h1>

            <div className="w-full max-w-md space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="text-2xl">📝</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Answer twelve questions honestly</h3>
                  <p className="text-gray-400">Be truthful with yourself for accurate results</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-2xl">🔒</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Your results are private</h3>
                  <p className="text-gray-400">No one else will see your answers or scores</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-2xl">⏱️</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Takes two minutes</h3>
                  <p className="text-gray-400">Quick and easy self-assessment</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full max-w-md rounded-xl glow-button px-8 py-4 font-bold text-white text-lg transition-all duration-300 hover:scale-105"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Écran de calcul
  if (currentState === 'calculating') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-black">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 animate-fade-in">
            <div className="mb-6 inline-block rounded-full bg-gradient-primary p-8 shadow-glow-md animate-pulse-glow">
              <Loader2 className="h-16 w-16 text-white animate-spin" />
            </div>
            <h2 className="mb-3 text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Calculating your score...
            </h2>
            <p className="text-gray-400 text-lg">Analyzing your responses</p>
          </div>
        </div>
      </div>
    );
  }

  // Écran de résultats
  if (currentState === 'results' && results) {
    return (
      <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full min-h-screen">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
        </div>

        <div className="relative z-10 flex flex-col px-6 md:px-8 lg:px-12 pt-8 pb-8 animate-fade-in overflow-x-hidden w-full max-w-[600px] md:max-w-none mx-auto md:mx-0" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Your Results</h1>
            <div className="text-6xl mb-4">
              {results.scores.total.toFixed(1)} <span className="text-2xl text-gray-400">/ 10</span>
            </div>
            <p className="text-gray-400">
              {results.scores.total <= 2 && 'All clear! Great job maintaining healthy relationship behaviors.'}
              {results.scores.total > 2 && results.scores.total <= 5 && 'Needs work. There are some areas you could improve.'}
              {results.scores.total > 5 && results.scores.total <= 8 && 'Warning signs. Consider reflecting on your relationship patterns.'}
              {results.scores.total > 8 && 'Major red flags. It may be helpful to seek support or counseling.'}
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Category Breakdown</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Communication</span>
                <span className="text-white font-bold">{results.scores.communication.toFixed(1)} / 10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Boundaries</span>
                <span className="text-white font-bold">{results.scores.boundaries.toFixed(1)} / 10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Attachment</span>
                <span className="text-white font-bold">{results.scores.attachment.toFixed(1)} / 10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Honesty</span>
                <span className="text-white font-bold">{results.scores.honesty.toFixed(1)} / 10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Toxic behaviors</span>
                <span className="text-white font-bold">{results.scores.toxic.toFixed(1)} / 10</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleBackToMe}
            className="w-full rounded-xl glow-button px-8 py-4 font-bold text-white text-lg transition-all duration-300 hover:scale-105"
          >
            View Full Results
          </button>
        </div>
      </div>
    );
  }

  // Écran du quiz
  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full min-h-screen">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
      </div>

      <div className="relative z-10 flex flex-col px-6 md:px-8 lg:px-12 pt-8 pb-8 animate-fade-in overflow-x-hidden w-full max-w-[600px] md:max-w-none mx-auto md:mx-0" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Question {currentQuestion + 1} / {QUESTIONS.length}</span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-12 text-center leading-relaxed">
            {question.text}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {ANSWER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value as QuestionAnswer)}
                className={`w-full rounded-2xl border-2 p-6 text-left transition-all duration-300 ${
                  answers[currentQuestion] === option.value
                    ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                    : 'border-white/20 bg-black/50 backdrop-blur-xl hover:border-white/40 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">{option.label}</span>
                  {answers[currentQuestion] === option.value && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`flex-1 rounded-xl border-2 p-4 font-bold text-white transition-all duration-300 ${
              currentQuestion === 0
                ? 'border-white/10 bg-black/30 opacity-50 cursor-not-allowed'
                : 'border-white/30 bg-black/50 backdrop-blur-xl hover:border-white/50 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              Previous
            </div>
          </button>
          <button
            onClick={handleNext}
            disabled={answers[currentQuestion] === 0}
            className={`flex-1 rounded-xl p-4 font-bold text-white transition-all duration-300 ${
              answers[currentQuestion] === 0
                ? 'bg-white/10 opacity-50 cursor-not-allowed'
                : 'glow-button hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {currentQuestion === QUESTIONS.length - 1 ? 'Submit' : 'Next'}
              {currentQuestion < QUESTIONS.length - 1 && <ChevronRight className="h-5 w-5" />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

