/**
 * Mistake Service
 * Handles mistake_journal CRUD and AI explanation fetching.
 */

import { supabase } from "@/lib/supabase";
import { MistakeEntry, Subject, Difficulty } from "@shared/coreTypes";

// ─── Save a Mistake ───────────────────────────────────────────────────────────

export async function saveMistake(
  userId: string,
  entry: Omit<MistakeEntry, "id" | "mastered" | "createdAt">
): Promise<void> {
  const { error } = await supabase.from("mistake_journal").insert({
    user_id: userId,
    question_text: entry.questionText,
    user_answer: entry.userAnswer,
    correct_answer: entry.correctAnswer,
    topic: entry.topic,
    subject: entry.subject,
    difficulty: entry.difficulty,
    explanation: entry.explanation ?? null,
    mastered: false,
    assessment_id: entry.assessmentId ?? null,
  });
  if (error) console.error("saveMistake error:", error);
}

// ─── Bulk Save Mistakes (after assessment) ────────────────────────────────────

export async function saveMistakesFromAssessment(
  userId: string,
  assessmentId: string,
  mistakes: {
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    topic: string;
    subject: Subject;
    difficulty: Difficulty;
  }[]
): Promise<void> {
  if (mistakes.length === 0) return;

  const rows = mistakes.map((m) => ({
    user_id: userId,
    assessment_id: assessmentId,
    question_text: m.questionText,
    user_answer: m.userAnswer,
    correct_answer: m.correctAnswer,
    topic: m.topic,
    subject: m.subject,
    difficulty: m.difficulty,
    mastered: false,
  }));

  const { error } = await supabase.from("mistake_journal").insert(rows);
  if (error) console.error("saveMistakesFromAssessment error:", error);
}

// ─── Get Mistakes ─────────────────────────────────────────────────────────────

export async function getMistakes(userId: string): Promise<MistakeEntry[]> {
  const { data, error } = await supabase
    .from("mistake_journal")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMistakes error:", error);
    return [];
  }
  return (data ?? []).map(mapMistake);
}

export async function getUnmasteredMistakes(userId: string): Promise<MistakeEntry[]> {
  const { data, error } = await supabase
    .from("mistake_journal")
    .select("*")
    .eq("user_id", userId)
    .eq("mastered", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUnmasteredMistakes error:", error);
    return [];
  }
  return (data ?? []).map(mapMistake);
}

// ─── Mark Mastered ────────────────────────────────────────────────────────────

export async function markMastered(mistakeId: string): Promise<void> {
  const { error } = await supabase
    .from("mistake_journal")
    .update({
      mastered: true,
      mastered_at: new Date().toISOString(),
    })
    .eq("id", mistakeId);
  if (error) console.error("markMastered error:", error);
}

// ─── Fetch + Save AI Explanation ──────────────────────────────────────────────

export async function fetchExplanation(
  mistakeId: string,
  questionText: string,
  correctAnswer: string,
  userAnswer: string,
  topic: string,
  grade: string
): Promise<string> {
  try {
    const response = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionText, correctAnswer, userAnswer, topic, grade }),
    });
    const data = await response.json();
    const explanation = data.explanation || "No explanation available.";

    // Persist to DB
    await supabase
      .from("mistake_journal")
      .update({ explanation })
      .eq("id", mistakeId);

    return explanation;
  } catch (err) {
    console.error("fetchExplanation error:", err);
    return "Unable to load explanation right now. Please try again.";
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getMistakeStats(
  userId: string
): Promise<{ total: number; mastered: number; byTopic: { topic: string; count: number }[] }> {
  const { data } = await supabase
    .from("mistake_journal")
    .select("topic, mastered")
    .eq("user_id", userId);

  const all = data ?? [];
  const total = all.length;
  const mastered = all.filter((m: any) => m.mastered).length;

  const topicCount = new Map<string, number>();
  for (const m of all) {
    if (!m.mastered) {
      topicCount.set(m.topic, (topicCount.get(m.topic) ?? 0) + 1);
    }
  }

  const byTopic = Array.from(topicCount.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { total, mastered, byTopic };
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapMistake(row: any): MistakeEntry {
  return {
    id: row.id,
    questionText: row.question_text,
    userAnswer: row.user_answer,
    correctAnswer: row.correct_answer,
    topic: row.topic,
    subject: row.subject,
    difficulty: row.difficulty,
    explanation: row.explanation,
    mastered: row.mastered,
    masteredAt: row.mastered_at,
    assessmentId: row.assessment_id,
    createdAt: row.created_at,
  };
}
