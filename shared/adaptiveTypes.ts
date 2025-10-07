export interface AdaptiveTestState {
  currentDifficulty: "Very Easy" | "Easy" | "Moderate" | "Hard";
  questionHistory: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    difficulty: string;
    subject: string;
    topic: string;
  }[];
  score: number;
  totalQuestions: number;
}

export interface DiagnosticReport {
  overallScore: number;
  strengthAreas: string[];
  weaknessAreas: string[];
  recommendations: string[];
  difficultyProgression: string[];
  subjectBreakdown: {
    subject: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
}