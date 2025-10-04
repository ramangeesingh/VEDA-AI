export interface GeminiTutorRequest {
  question: string;
  grade: string;
  conversationHistory: { role: "user" | "assistant"; text: string }[];
}

export interface GeminiTutorResponse {
  response: string;
  success: boolean;
  error?: string;
}