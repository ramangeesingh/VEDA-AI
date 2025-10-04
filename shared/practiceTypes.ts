export interface GeminiPracticeRequest {
  grade: string;
  subject: string;
  difficulty: string;
  count: number;
}

export interface GeminiPracticeResponse {
  questions: {
    id: string;
    text: string;
    options: { id: string; label: string; correct?: boolean }[];
  }[];
  success: boolean;
  error?: string;
}