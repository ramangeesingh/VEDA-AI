import { Difficulty, Subject } from "@shared/coreTypes";

export async function generateQuestions(
  grade: string,
  subject: string,
  difficulty: string,
  count: number
): Promise<any[]> {
  try {
    // Try the new adaptive assessment endpoint first
    const response = await fetch("/api/assessment/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, subject, difficulty, count }),
    });

    const data = await response.json();
    if (data.success && data.questions.length > 0) {
      return data.questions;
    }

    // Fallback to legacy practice endpoint
    const legacyResponse = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, subject, difficulty, count }),
    });
    const legacyData = await legacyResponse.json();
    if (legacyData.success && legacyData.questions.length > 0) {
      return legacyData.questions;
    }
    return [];
  } catch (error) {
    console.error("generateQuestions error:", error);
    return [];
  }
}