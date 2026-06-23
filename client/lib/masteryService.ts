/**
 * Mastery Service
 * Handles student_stats, learning_profiles, topic_mastery, and weak_topics in Supabase.
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
  Assessment,
} from "@shared/coreTypes";
import { User } from "@supabase/supabase-js";

// ─── Student Profile (Merged stats + learning dimensions) ──────────────────────

export async function getOrCreateStudentProfile(
  user: User
): Promise<StudentProfile | null> {
  try {
    // 1. Fetch or create student_stats
    const { data: existingStats, error: statsError } = await supabase
      .from("student_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let statsRow = existingStats;

    if (statsError || !statsRow) {
      const displayName =
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner";
      const avatarUrl = user.user_metadata?.avatar_url;

      const { data: createdStats, error: statsCreateError } = await supabase
        .from("student_stats")
        .insert({
          user_id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          level: 1,
          xp: 0,
          streak: 0,
        })
        .select("*")
        .single();

      if (statsCreateError) {
        console.error("Error creating student_stats:", statsCreateError);
        return null;
      }
      statsRow = createdStats;
    }

    // 2. Fetch or create learning_profiles
    const { data: existingLp, error: lpError } = await supabase
      .from("learning_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let lpRow = existingLp;

    if (lpError || !lpRow) {
      const { data: createdLp, error: lpCreateError } = await supabase
        .from("learning_profiles")
        .insert({
          user_id: user.id,
          retention: 0,
          application: 0,
          grasping: 0,
          speed: 0,
          accuracy: 0,
        })
        .select("*")
        .single();

      if (lpCreateError) {
        console.error("Error creating learning_profiles:", lpCreateError);
        return null;
      }
      lpRow = createdLp;
    }

    return {
      id: statsRow.id,
      userId: statsRow.user_id,
      grade: statsRow.grade,
      displayName: statsRow.display_name,
      avatarUrl: statsRow.avatar_url,
      retention: lpRow.retention ?? 0,
      application: lpRow.application ?? 0,
      grasping: lpRow.grasping ?? 0,
      speed: lpRow.speed ?? 0,
      accuracy: lpRow.accuracy ?? 0,
      xp: statsRow.xp ?? 0,
      streak: statsRow.streak ?? 0,
      lastActive: statsRow.last_active,
    };
  } catch (err) {
    console.error("getOrCreateStudentProfile catch:", err);
    return null;
  }
}

export async function updateStudentProfile(
  userId: string,
  updates: Partial<{
    grade: string;
    retention: number;
    application: number;
    grasping: number;
    speed: number;
    accuracy: number;
    xp: number;
    streak: number;
    lastActive: string;
  }>
): Promise<void> {
  const statsUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  const lpUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

  let hasStats = false;
  let hasLp = false;

  if (updates.grade !== undefined) { statsUpdates.grade = updates.grade; hasStats = true; }
  if (updates.xp !== undefined) { statsUpdates.xp = updates.xp; hasStats = true; }
  if (updates.streak !== undefined) { statsUpdates.streak = updates.streak; hasStats = true; }
  if (updates.lastActive !== undefined) { statsUpdates.last_active = updates.lastActive; hasStats = true; }

  if (updates.retention !== undefined) { lpUpdates.retention = updates.retention; hasLp = true; }
  if (updates.application !== undefined) { lpUpdates.application = updates.application; hasLp = true; }
  if (updates.grasping !== undefined) { lpUpdates.grasping = updates.grasping; hasLp = true; }
  if (updates.speed !== undefined) { lpUpdates.speed = updates.speed; hasLp = true; }
  if (updates.accuracy !== undefined) { lpUpdates.accuracy = updates.accuracy; hasLp = true; }

  const promises = [];
  if (hasStats) {
    promises.push(
      supabase.from("student_stats").update(statsUpdates).eq("user_id", userId)
    );
  }
  if (hasLp) {
    promises.push(
      supabase.from("learning_profiles").update(lpUpdates).eq("user_id", userId)
    );
  }

  await Promise.all(promises);
}

// ─── Recalculate Profile Dimensions From Database Logs ────────────────────────

export async function recalculateLearningProfile(userId: string): Promise<void> {
  try {
    // 1. Fetch all completed assessments
    const { data: assessments } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed");

    // 2. Fetch all responses
    const { data: responses } = await supabase
      .from("assessment_responses")
      .select("*")
      .eq("user_id", userId);

    if (!assessments || !responses || responses.length === 0) return;

    const totalAssessments = assessments.length;
    const totalQuestions = responses.length;
    const totalCorrect = responses.filter((r) => r.is_correct).length;

    // Accuracy: total correct / total questions
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);

    // Speed: map average response time to score (5s = 100, 25s = 0)
    const avgResponseTime =
      responses.reduce((sum, r) => sum + r.response_time_ms, 0) / totalQuestions;
    const speed = Math.max(
      0,
      Math.min(100, Math.round(((25000 - avgResponseTime) / 20000) * 100))
    );

    // Application: % correct on Hard questions (default 50 if none)
    const hardQs = responses.filter((r) => r.difficulty_at_time === "Hard");
    const application =
      hardQs.length > 0
        ? Math.round((hardQs.filter((r) => r.is_correct).length / hardQs.length) * 100)
        : 50;

    // Grasping: speed-weighted correctness
    const grasping = Math.min(
      100,
      Math.round(
        (responses.reduce((sum, r) => {
          const speedFactor = Math.max(0.1, Math.min(1, 10000 / r.response_time_ms));
          return sum + (r.is_correct ? speedFactor : 0);
        }, 0) /
          totalQuestions) *
          100
      )
    );

    // Retention: correct % on topics already attempted previously (historical responses)
    let retentionCorrect = 0;
    let retentionTotal = 0;
    const topicAttemptCounts = new Map<string, number>();

    // Sort responses chronologically to simulate progression
    const sortedResponses = [...responses].sort(
      (a, b) =>
        new Date(a.answered_at || 0).getTime() - new Date(b.answered_at || 0).getTime()
    );

    for (const r of sortedResponses) {
      const count = topicAttemptCounts.get(r.topic) ?? 0;
      if (count > 0) {
        retentionTotal++;
        if (r.is_correct) retentionCorrect++;
      }
      topicAttemptCounts.set(r.topic, count + 1);
    }

    const retention =
      retentionTotal > 0
        ? Math.round((retentionCorrect / retentionTotal) * 100)
        : accuracy; // Fallback to overall accuracy

    // Update learning_profiles
    await supabase.from("learning_profiles").upsert(
      {
        user_id: userId,
        retention,
        application,
        grasping,
        speed,
        accuracy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Update student_stats with aggregate counts and level calculation
    const totalXp = assessments.reduce(
      (sum, a) =>
        sum + (a.overall_score >= 80 ? 150 : a.overall_score >= 60 ? 100 : 50),
      0
    );
    const calculatedLevel = Math.max(1, Math.floor(totalXp / 150) + 1);

    await supabase
      .from("student_stats")
      .update({
        total_assessments: totalAssessments,
        total_questions_answered: totalQuestions,
        total_correct: totalCorrect,
        level: calculatedLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } catch (err) {
    console.error("recalculateLearningProfile error:", err);
  }
}

// ─── Mastery Scores ───────────────────────────────────────────────────────────

export async function getMasteryScores(userId: string): Promise<MasteryScore[]> {
  const { data, error } = await supabase
    .from("topic_mastery")
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
    .from("topic_mastery")
    .select("mastery_pct, attempts")
    .eq("user_id", userId)
    .eq("subject", subject)
    .eq("topic", topic)
    .single();

  const prevPct = existing?.mastery_pct ?? 0;
  const attempts = (existing?.attempts ?? 0) + 1;
  // EMA α=0.4
  const blended = Math.round(0.4 * newPct + 0.6 * prevPct);

  const { error } = await supabase.from("topic_mastery").upsert(
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
    .limit(10); // get up to 10 for charts

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
      timeTakenMs: a.time_taken_ms ?? 0,
      avgResponseTimeMs: a.avg_response_time_ms ?? 0,
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
      const severity: Severity =
        t.percentage < 30 ? "critical" : t.percentage < 40 ? "moderate" : "mild";
      return flagWeakTopic(userId, t.subject, t.topic, severity);
    });

  // Resolve topics that improved
  const resolves = report.topicBreakdown
    .filter((t) => t.percentage >= 70)
    .map((t) => resolveWeakTopic(userId, t.subject, t.topic));

  await Promise.all([...weakFlags, ...resolves]);

  // Trigger profile recalculation
  await recalculateLearningProfile(userId);
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

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
