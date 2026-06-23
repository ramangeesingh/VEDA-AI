import { Subject, Difficulty } from "../../../shared/coreTypes";

export interface VedaMCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  classLevel: string;
}

export interface QuestionRequest {
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  classLevel: string;
  count: number;
  avoidQuestions?: string[]; // question texts to avoid duplicate matches
}

export interface LogEntry {
  providerUsed: string;
  success: boolean;
  failureReason?: string;
  generationTime: number;
}
