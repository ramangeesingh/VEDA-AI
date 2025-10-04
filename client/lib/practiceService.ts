import { GeminiPracticeRequest, GeminiPracticeResponse } from "@shared/practiceTypes";

export async function generateQuestions(
  grade: string,
  subject: string,
  difficulty: string,
  count: number
): Promise<any[]> {
  try {
    console.log('Calling practice API with:', { grade, subject, difficulty, count });
    
    const request: GeminiPracticeRequest = {
      grade,
      subject,
      difficulty,
      count
    };

    const response = await fetch('/api/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const data: GeminiPracticeResponse = await response.json();
    console.log('Practice API response:', data);
    
    if (data.success && data.questions.length > 0) {
      console.log('Using Gemini questions:', data.questions.length);
      return data.questions;
    } else {
      console.error('Practice API failed or no questions:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Practice service error:', error);
    return [];
  }
}