/**
 * Mastery Service
 * Handles student_profiles, mastery_scores, and weak_topics in Supabase.
 */

import { supabase } from "@/lib/supabase";
import {
  StudentProfile,
  MasteryScore,
  WeakTopic,
  LearningProfile,
  Subject,
  Severity,
  AssessmentReport,
} from "@shared/coreTypes";
import { User } from "@supabase/supabase-js";

// ─── Student Profile ──────────────────────────────────────────────────────────

export async function getOrCreateStudentProfile(
  user: User
): Promise<StudentProfile | null> {
  // Try to fetch existing
  const { data: existing, error: fetchError } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing && !fetchError) return mapProfile(existing);

  // Create new profile
  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner";
  const avatarUrl = user.user_metadata?.avatar_url;

  const { data: created, error: createError } = await supabase
    .from("student_profiles")
    .insert({
      user_id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      retention: 0,
      application: 0,
      grasping: 0,
      speed: 0,
      xp: 0,
      streak: 0,
    })
    .select("*")
    .single();

  if (createError) {
    console.error("getOrCreateStudentProfile error:", createError);
    return null;
  }
  return mapProfile(created);
}

export async function updateStudentProfile(
  userId: string,
  updates: Partial<{
    grade: string;
    retention: number;
    application: number;
    grasping: number;
    speed: number;
    xp: number;
    streak: number;
    lastActive: string;
  }>
): Promise<void> {
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
  if (updates.retention !== undefined) dbUpdates.retention = updates.retention;
  if (updates.application !== undefined) dbUpdates.application = updates.application;
  if (updates.grasping !== undefined) dbUpdates.grasping = updates.grasping;
  if (updates.speed !== undefined) dbUpdates.speed = updates.speed;
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
  if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
  if (updates.lastActive !== undefined) dbUpdates.last_active = updates.lastActive;

  const { error } = await supabase
    .from("student_profiles")
    .update(dbUpdates)
    .eq("user_id", userId);
  if (error) console.error("updateStudentProfile error:", error);
}

// ─── Mastery Scores ───────────────────────────────────────────────────────────

export async function getMasteryScores(userId: string): Promise<MasteryScore[]> {
  const { data, error } = await supabase
    .from("mastery_scores")
    .select("*")
    .eq("user_id", userId)
    .order("mastery_pct", { ascending: true });

  if (error) {
    console.error("getMasteryScores error:", error);
    return [];
  }
  return (data ?? []).map(mapMastery);
}

export async function upsertMastery(
  userId: string,
  subject: Subject,
  topic: string,
  newPct: number
): Promise<void> {
  // Fetch existing to do EMA blend
  const { data: existing } = await supabase
    .from("mastery_scores")
    .select("mastery_pct, attempts")
    .eq("user_id", userId)
    .eq("subject", subject)
    .eq("topic", topic)
    .single();

  const prevPct = existing?.mastery_pct ?? 0;
  const attempts = (existing?.attempts ?? 0) + 1;
  // EMA α=0.4 — newer sessions matter more
  const blended = Math.round(0.4 * newPct + 0.6 * prevPct);

  const { error } = await supabase.from("mastery_scores").upsert(
    {
      user_id: userId,
      subject,
      topic,
      mastery_pct: blended,
      attempts,
      last_tested: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,subject,topic" }
  );
  if (error) console.error("upsertMastery error:", error);
}

// ─── Weak Topics ──────────────────────────────────────────────────────────────

export async function getWeakTopics(userId: string): Promise<WeakTopic[]> {
  const { data, error } = await supabase
    .from("weak_topics")
    .select("*")
    .eq("user_id", userId)
    .is("resolved_at", null)
    .order("flagged_at", { ascending: false });

  if (error) {
    console.error("getWeakTopics error:", error);
    return [];
  }
  return (data ?? []).map(mapWeakTopic);
}

export async function flagWeakTopic(
  userId: string,
  subject: Subject,
  topic: string,
  severity: Severity
): Promise<void> {
  const { error } = await supabase.from("weak_topics").upsert(
    {
      user_id: userId,
      subject,
      topic,
      severity,
      flagged_at: new Date().toISOString(),
      resolved_at: null,
    },
    { onConflict: "user_id,subject,topic" }
  );
  if (error) console.error("flagWeakTopic error:", error);
}

export async function resolveWeakTopic(
  userId: string,
  subject: Subject,
  topic: string
): Promise<void> {
  const { error } = await supabase
    .from("weak_topics")
    .update({ resolved_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("subject", subject)
    .eq("topic", topic);
  if (error) console.error("resolveWeakTopic error:", error);
}

// ─── Full Learning Profile ────────────────────────────────────────────────────

export async function getLearningProfile(
  userId: string,
  user: User
): Promise<LearningProfile | null> {
  const [profile, masteryScores, weakTopics] = await Promise.all([
    getOrCreateStudentProfile(user),
    getMasteryScores(userId),
    getWeakTopics(userId),
  ]);

  if (!profile) return null;

  // Fetch recent completed assessments
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(5);

  return {
    profile,
    masteryScores,
    weakTopics,
    recentAssessments: (assessments ?? []).map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      grade: a.grade,
      subject: a.subject,
      status: a.status,
      totalQuestions: a.total_questions,
      correctAnswers: a.correct_answers,
      overallScore: a.overall_score,
      startedAt: a.started_at,
      completedAt: a.completed_at,
      finalDifficulty: a.final_difficulty,
      difficultyProgression: a.difficulty_progression ?? [],
    })),
  };
}

// ─── Post-Assessment Mastery Update ──────────────────────────────────────────

export async function applyReportToMastery(
  userId: string,
  report: AssessmentReport
): Promise<void> {
  // Update per-topic mastery
  const updates = report.topicBreakdown.map((t) =>
    upsertMastery(userId, t.subject, t.topic, t.percentage)
  );
  // Update subject-level mastery (topic = '')
  const subjUpdates = report.subjectBreakdown.map((s) =>
    upsertMastery(userId, s.subject, "", s.percentage)
  );

  await Promise.all([...updates, ...subjUpdates]);

  // Flag weak topics
  const weakFlags = report.topicBreakdown
    .filter((t) => t.percentage < 50)
    .map((t) => {
      const severity: Severity = t.percentage < 30 ? "critical" : t.percentage < 40 ? "moderate" : "mild";
      return flagWeakTopic(userId, t.subject, t.topic, severity);
    });

  // Resolve topics that improved
  const resolves = report.topicBreakdown
    .filter((t) => t.percentage >= 70)
    .map((t) => resolveWeakTopic(userId, t.subject, t.topic));

  await Promise.all([...weakFlags, ...resolves]);
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapProfile(row: any): StudentProfile {
  return {
    id: row.id,
    userId: row.user_id,
    grade: row.grade,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    retention: row.retention ?? 0,
    application: row.application ?? 0,
    grasping: row.grasping ?? 0,
    speed: row.speed ?? 0,
    xp: row.xp ?? 0,
    streak: row.streak ?? 0,
    lastActive: row.last_active,
  };
}

function mapMastery(row: any): MasteryScore {
  return {
    id: row.id,
    subject: row.subject,
    topic: row.topic,
    masteryPct: row.mastery_pct,
    attempts: row.attempts,
    lastTested: row.last_tested,
  };
}

function mapWeakTopic(row: any): WeakTopic {
  return {
    id: row.id,
    subject: row.subject,
    topic: row.topic,
    severity: row.severity,
    flaggedAt: row.flagged_at,
    resolvedAt: row.resolved_at,
  };
}
