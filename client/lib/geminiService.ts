import { GeminiTutorRequest, GeminiTutorResponse } from "@shared/geminiTypes";

export async function askTutor(
  question: string, 
  grade: string, 
  conversationHistory: { role: "user" | "assistant"; text: string }[]
): Promise<string> {
  try {
    const request: GeminiTutorRequest = {
      question,
      grade,
      conversationHistory
    };

    const response = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const data: GeminiTutorResponse = await response.json();
    
    if (data.success) {
      return data.response;
    } else {
      return data.response || "I'm having trouble right now. Please try again!";
    }
  } catch (error) {
    console.error('Tutor API error:', error);
    return "I'm having trouble connecting right now. Please try again!";
  }
}