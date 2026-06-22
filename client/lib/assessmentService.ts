/**
 * Assessment Service — Client Side
 *
 * Handles Supabase CRUD for assessments, assessment_questions, assessment_responses
 * and the adaptive engine computation (report building).
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
  Question,
  StartAssessmentRequest,
  StartAssessmentResponse,
  SaveResponseRequest,
} from "@shared/coreTypes";

// ─── Difficulty Ladder ────────────────────────────────────────────────────────

const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

// Thresholds (milliseconds)
const FAST_THRESHOLD_MS = 8000;   // < 8s = fast
const SLOW_THRESHOLD_MS = 20000;  // > 20s = slow

export function computeNextDifficulty(
  current: Difficulty,
  isCorrect: boolean,
  responseTimeMs: number
): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  if (isCorrect) {
    if (responseTimeMs < FAST_THRESHOLD_MS && idx < DIFFICULTY_ORDER.length - 1) {
      // Correct + Fast → increase difficulty
      return DIFFICULTY_ORDER[idx + 1];
    }
    // Correct + Slow/Medium → stay same
    return current;
  } else {
    // Incorrect → decrease difficulty
    if (idx > 0) return DIFFICULTY_ORDER[idx - 1];
    return current;
  }
}

// ─── Batch Start Assessment (new primary flow) ────────────────────────────────

/**
 * Calls /api/assessment/start which:
 * 1. Generates all 15+ questions via Gemini JSON mode
 * 2. Creates an `assessments` row in Supabase
 * 3. Saves all questions to `assessment_questions`
 * 4. Returns assessmentId + full question list
 */
export async function startAndLoadAssessment(
  userId: string,
  grade: string,
  subject: Subject,
  totalQuestions = 15
): Promise<{ assessmentId: string; questions: Question[] } | null> {
  try {
    const body: StartAssessmentRequest = { userId, grade, subject, totalQuestions };
    const response = await fetch("/api/assessment/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data: StartAssessmentResponse = await response.json();

    if (!data.success || !data.questions.length) {
      console.error("startAndLoadAssessment failed:", data.error);
      return null;
    }

    return { assessmentId: data.assessmentId, questions: data.questions };
  } catch (err) {
    console.error("startAndLoadAssessment error:", err);
    return null;
  }
}

// ─── Legacy: create assessment row directly (fallback) ────────────────────────

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

// ─── Save Single Response via API ─────────────────────────────────────────────

/**
 * Saves a student's response to assessment_responses via the server.
 * This goes through the Express route so we keep auth on server side if needed.
 */
export async function saveAssessmentResponse(
  req: SaveResponseRequest
): Promise<void> {
  try {
    await fetch("/api/assessment/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch (err) {
    console.error("saveAssessmentResponse error:", err);
  }
}

// ─── Legacy: submit response directly to Supabase responses table ─────────────

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

// ─── Adaptive Question Selector ───────────────────────────────────────────────

/**
 * From a pre-loaded question pool, pick the next question
 * matching the current difficulty. Falls back to adjacent difficulty
 * if the target difficulty pool is exhausted.
 */
export function selectNextQuestion(
  pool: Question[],
  usedIds: Set<string>,
  difficulty: Difficulty
): Question | null {
  // Try target difficulty first
  const target = pool.filter(
    (q) => q.difficulty === difficulty && !usedIds.has(q.id)
  );
  if (target.length > 0) {
    return target[Math.floor(Math.random() * target.length)];
  }

  // Fall back to adjacent difficulties
  const order: Difficulty[] = ["Easy", "Medium", "Hard"];
  for (const d of order) {
    const fallback = pool.filter((q) => q.difficulty === d && !usedIds.has(q.id));
    if (fallback.length > 0) {
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
  }

  return null;
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
  const avgResponseTimeMs = total > 0
    ? Math.round(answers.reduce((s, a) => s + a.responseTimeMs, 0) / total)
    : 0;

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

  // XP: 10 per correct answer, 2 per attempt, bonus for streak
  let streak = 0;
  let maxStreak = 0;
  let bonusXp = 0;
  for (const a of answers) {
    if (a.isCorrect) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
      if (streak >= 5) bonusXp += 5; // streak bonus
    } else {
      streak = 0;
    }
  }
  const xpEarned = correct * 10 + answers.length * 2 + bonusXp;

  // Updated profile dimensions (EMA α=0.3)
  const α = 0.3;
  const hardAnswers = answers.filter((a) => a.difficulty === "Hard");
  const applicationRaw =
    hardAnswers.length > 0
      ? Math.round(
          (hardAnswers.filter((a) => a.isCorrect).length / hardAnswers.length) * 100
        )
      : prevProfile.application;

  const speedRaw = Math.max(
    0,
    Math.round(Math.max(0, (SLOW_THRESHOLD_MS - avgResponseTimeMs) / SLOW_THRESHOLD_MS) * 100)
  );

  const graspingRaw =
    answers.length > 0
      ? Math.min(
          100,
          Math.round(
            (answers.reduce((s, a) => {
              const speedFactor = Math.max(0.1, Math.min(1, 10000 / a.responseTimeMs));
              return s + (a.isCorrect ? speedFactor : 0);
            }, 0) /
              answers.length) *
              100
          )
        )
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
