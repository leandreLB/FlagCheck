export interface SelfTestScores {
  communication: number;
  boundaries: number;
  attachment: number;
  honesty: number;
  toxic: number;
  total: number;
}

export interface SelfTest {
  testId: string;
  date: string; // ISO 8601 timestamp
  scores: SelfTestScores;
  answers: number[]; // 12 answers, each 1-5
  completed: boolean;
}

export type QuestionAnswer = 1 | 2 | 3 | 4 | 5; // Never, Rarely, Sometimes, Often, Always

export interface CategoryScores {
  communication: number;
  boundaries: number;
  attachment: number;
  honesty: number;
  toxic: number;
}

export interface Question {
  id: number;
  text: string;
  category: keyof CategoryScores;
}

