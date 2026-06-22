/**
 * Veda Core Intelligence — Shared Domain Types
 * Used by both client and server.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Subject = "Math" | "Science" | "English" | "Mixed";
export type Severity = "mild" | "moderate" | "critical";
export type AssessmentStatus = "in_progress" | "completed";

// ─── Question ─────────────────────────────────────────────────────────────────

export interface QuestionOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface Question {
  id: string;
  grade: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  text: string;
  options: QuestionOption[];
  explanation?: string;
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export interface Assessment {
  id: string;
  userId: string;
  grade: string;
  subject: Subject;
  status: AssessmentStatus;
  totalQuestions: number;
  correctAnswers: number;
  overallScore: number;
  startedAt: string;
  completedAt?: string;
  finalDifficulty?: Difficulty;
  difficultyProgression: string[];
}

export interface Response {
  questionText: string;
  topic: string;
  subject: Subject;
  difficulty: Difficulty;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
}

// ─── Mastery ──────────────────────────────────────────────────────────────────

export interface MasteryScore {
  id?: string;
  subject: Subject;
  topic: string; // '' means subject-level score
  masteryPct: number;
  attempts: number;
  lastTested: string;
}

// ─── Weak / Strong Topics ─────────────────────────────────────────────────────

export interface WeakTopic {
  id?: string;
  subject: Subject;
  topic: string;
  severity: Severity;
  flaggedAt: string;
  resolvedAt?: string;
}

// ─── Student Profile ──────────────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  userId: string;
  grade?: string;
  displayName: string;
  avatarUrl?: string;
  // Learning Profile dimensions (0–100)
  retention: number;   // % correct on revisited topics
  application: number; // % correct on Hard questions
  grasping: number;    // speed-weighted correctness
  speed: number;       // avg response time score
  xp: number;
  streak: number;
  lastActive?: string;
}

// ─── Learning Profile (composite) ────────────────────────────────────────────

export interface LearningProfile {
  profile: StudentProfile;
  masteryScores: MasteryScore[];
  weakTopics: WeakTopic[];
  recentAssessments: Assessment[];
}

// ─── Mistake Journal ──────────────────────────────────────────────────────────

export interface MistakeEntry {
  id: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  topic: string;
  subject: Subject;
  difficulty: Difficulty;
  explanation?: string;
  mastered: boolean;
  masteredAt?: string;
  assessmentId?: string;
  createdAt: string;
}

// ─── Practice Set ─────────────────────────────────────────────────────────────

export interface PracticeSet {
  id: string;
  topic: string;
  subject: Subject;
  difficulty: Difficulty;
  questions: Question[];
  createdAt: string;
}

// ─── Adaptive Engine State ────────────────────────────────────────────────────

export interface AnswerRecord {
  question: string;
  topic: string;
  subject: Subject;
  difficulty: Difficulty;
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
  userAnswer: string;
  correctAnswer: string;
}

export interface AssessmentSession {
  assessmentId: string;
  grade: string;
  subject: Subject;
  currentDifficulty: Difficulty;
  questionIndex: number;
  totalQuestions: number;
  answers: AnswerRecord[];
  startedAt: number; // Date.now()
}

// ─── Assessment Report ───────────────────────────────────────────────────────

export interface SubjectBreakdown {
  subject: Subject;
  correct: number;
  total: number;
  percentage: number;
}

export interface TopicBreakdown {
  topic: string;
  subject: Subject;
  correct: number;
  total: number;
  percentage: number;
}

export interface AssessmentReport {
  assessmentId: string;
  overallScore: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTakenMs: number;
  subjectBreakdown: SubjectBreakdown[];
  topicBreakdown: TopicBreakdown[];
  strengthTopics: string[];
  weakTopics: string[];
  difficultyProgression: string[];
  finalDifficulty: Difficulty;
  xpEarned: number;
  // Updated profile dimensions after this assessment
  updatedProfile: {
    retention: number;
    application: number;
    grasping: number;
    speed: number;
  };
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface GenerateQuestionRequest {
  grade: string;
  subject: Subject;
  difficulty: Difficulty;
  avoidTopics?: string[]; // topics already tested this session
  count?: number;
}

export interface GenerateQuestionResponse {
  questions: Question[];
  success: boolean;
  error?: string;
}

export interface ExplainRequest {
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  topic: string;
  grade: string;
}

export interface ExplainResponse {
  explanation: string;
  success: boolean;
  error?: string;
}
