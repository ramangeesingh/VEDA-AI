/**
 * Assessment Service
 * Handles all Supabase CRUD for assessments, responses, and adaptive engine logic.
 */

import { supabase } from "@/lib/supabase";
import {
  Assessment,
  AssessmentReport,
  AssessmentSession,
  AnswerRecord,
  Difficulty,
  Subject,
  Response as VedaResponse,
} from "@shared/coreTypes";

// ─── Difficulty Ladder ────────────────────────────────────────────────────────

const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

export function computeNextDifficulty(
  current: Difficulty,
  isCorrect: boolean,
  responseTimeMs: number
): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  if (isCorrect) {
    // Fast correct (<8s) → go up; slow correct (>20s) → stay
    if (responseTimeMs < 8000 && idx < DIFFICULTY_ORDER.length - 1) {
      return DIFFICULTY_ORDER[idx + 1];
    }
    return current;
  } else {
    // Incorrect → go down
    if (idx > 0) return DIFFICULTY_ORDER[idx - 1];
    return current;
  }
}

// ─── Assessment CRUD ──────────────────────────────────────────────────────────

export async function startAssessment(
  userId: string,
  grade: string,
  subject: Subject
): Promise<string | null> {
  const { data, error } = await supabase
    .from("assessments")
    .insert({
      user_id: userId,
      grade,
      subject,
      status: "in_progress",
      total_questions: 0,
      correct_answers: 0,
      overall_score: 0,
      difficulty_progression: [],
    })
    .select("id")
    .single();

  if (error) {
    console.error("startAssessment error:", error);
    return null;
  }
  return data.id;
}

export async function submitResponse(
  assessmentId: string,
  userId: string,
  response: VedaResponse
): Promise<void> {
  const { error } = await supabase.from("responses").insert({
    assessment_id: assessmentId,
    user_id: userId,
    question_text: response.questionText,
    topic: response.topic,
    subject: response.subject,
    difficulty: response.difficulty,
    user_answer: response.userAnswer,
    correct_answer: response.correctAnswer,
    is_correct: response.isCorrect,
    response_time_ms: response.responseTimeMs,
    hint_used: response.hintUsed,
  });
  if (error) console.error("submitResponse error:", error);
}

export async function completeAssessment(
  assessmentId: string,
  report: AssessmentReport
): Promise<void> {
  const { error } = await supabase
    .from("assessments")
    .update({
      status: "completed",
      total_questions: report.totalQuestions,
      correct_answers: report.correctAnswers,
      overall_score: report.overallScore,
      completed_at: new Date().toISOString(),
      final_difficulty: report.finalDifficulty,
      difficulty_progression: report.difficultyProgression,
    })
    .eq("id", assessmentId);
  if (error) console.error("completeAssessment error:", error);
}

export async function getAssessmentHistory(
  userId: string,
  limit = 10
): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getAssessmentHistory error:", error);
    return [];
  }
  return (data ?? []).map(mapAssessment);
}

function mapAssessment(row: any): Assessment {
  return {
    id: row.id,
    userId: row.user_id,
    grade: row.grade,
    subject: row.subject,
    status: row.status,
    totalQuestions: row.total_questions,
    correctAnswers: row.correct_answers,
    overallScore: row.overall_score,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    finalDifficulty: row.final_difficulty,
    difficultyProgression: row.difficulty_progression ?? [],
  };
}

// ─── Report Builder ───────────────────────────────────────────────────────────

export function buildReport(
  assessmentId: string,
  session: AssessmentSession,
  prevProfile: { retention: number; application: number; grasping: number; speed: number }
): AssessmentReport {
  const answers = session.answers;
  const total = answers.length;
  const correct = answers.filter((a) => a.isCorrect).length;
  const overallScore = total > 0 ? Math.round((correct / total) * 100) : 0;
  const timeTakenMs = Date.now() - session.startedAt;

  // Topic breakdown
  const topicMap = new Map<string, { correct: number; total: number; subject: Subject }>();
  for (const a of answers) {
    const key = `${a.subject}::${a.topic}`;
    const prev = topicMap.get(key) ?? { correct: 0, total: 0, subject: a.subject };
    topicMap.set(key, {
      correct: prev.correct + (a.isCorrect ? 1 : 0),
      total: prev.total + 1,
      subject: a.subject,
    });
  }

  const topicBreakdown = Array.from(topicMap.entries()).map(([key, v]) => {
    const [subject, topic] = key.split("::");
    return {
      topic,
      subject: subject as Subject,
      correct: v.correct,
      total: v.total,
      percentage: Math.round((v.correct / v.total) * 100),
    };
  });

  // Subject breakdown (aggregate)
  const subjMap = new Map<Subject, { correct: number; total: number }>();
  for (const a of answers) {
    const prev = subjMap.get(a.subject) ?? { correct: 0, total: 0 };
    subjMap.set(a.subject, {
      correct: prev.correct + (a.isCorrect ? 1 : 0),
      total: prev.total + 1,
    });
  }
  const subjectBreakdown = Array.from(subjMap.entries()).map(([subject, v]) => ({
    subject,
    correct: v.correct,
    total: v.total,
    percentage: Math.round((v.correct / v.total) * 100),
  }));

  const strengthTopics = topicBreakdown
    .filter((t) => t.percentage >= 70)
    .map((t) => t.topic);
  const weakTopics = topicBreakdown
    .filter((t) => t.percentage < 50)
    .map((t) => t.topic);

  const difficultyProgression = answers.map(
    (a) => `${a.difficulty}: ${a.isCorrect ? "✓" : "✗"}`
  );

  // XP: 10 per correct, 2 per attempt
  const xpEarned = correct * 10 + answers.length * 2;

  // Updated profile dimensions (EMA α=0.3)
  const α = 0.3;
  const hardAnswers = answers.filter((a) => a.difficulty === "Hard");
  const applicationRaw = hardAnswers.length > 0
    ? Math.round((hardAnswers.filter((a) => a.isCorrect).length / hardAnswers.length) * 100)
    : prevProfile.application;
  const avgSpeedMs = answers.reduce((s, a) => s + a.responseTimeMs, 0) / (answers.length || 1);
  const speedRaw = Math.max(0, Math.round(Math.max(0, (20000 - avgSpeedMs) / 20000) * 100));
  const graspingRaw = answers.length > 0
    ? Math.round(answers.reduce((s, a) => {
        const speedFactor = Math.max(0.1, Math.min(1, 10000 / a.responseTimeMs));
        return s + (a.isCorrect ? speedFactor : 0);
      }, 0) / answers.length * 100)
    : prevProfile.grasping;
  const retentionRaw = overallScore;

  const ema = (prev: number, curr: number) =>
    Math.round(α * curr + (1 - α) * prev);

  return {
    assessmentId,
    overallScore,
    totalQuestions: total,
    correctAnswers: correct,
    timeTakenMs,
    subjectBreakdown,
    topicBreakdown,
    strengthTopics,
    weakTopics,
    difficultyProgression,
    finalDifficulty: session.currentDifficulty,
    xpEarned,
    updatedProfile: {
      retention: ema(prevProfile.retention, retentionRaw),
      application: ema(prevProfile.application, applicationRaw),
      grasping: Math.min(100, ema(prevProfile.grasping, graspingRaw)),
      speed: ema(prevProfile.speed, speedRaw),
    },
  };
}
