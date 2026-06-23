/**
 * useAssessmentActivity
 *
 * Fetches all data required by the restored dashboard sections:
 *  • Daily Practice Chart  → questions attempted per day (last 7 days)
 *  • Strong Topics          → topic_mastery rows with mastery_pct >= 70
 *  • Learning Progress      → totalAssessments, questionsAnswered, XP, level, streak
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface DayActivity {
  day: string;     // "Mon 23", "Tue 24", …
  questions: number;
}

export interface StrongTopic {
  topic: string;
  subject: string;
  masteryPct: number;
}

export interface DashboardStats {
  totalAssessments: number;
  questionsAnswered: number;
  xpEarned: number;
  level: number;
  streak: number;
  dailyActivity: DayActivity[];
  strongTopics: StrongTopic[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const QUERY_KEY = (uid: string | undefined) => ["dashboardStats", uid];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  // Run independent queries in parallel
  const [
    statsResult,
    assessmentCountResult,
    responseCountResult,
    activityResult,
    strongResult,
  ] = await Promise.allSettled([
    // student_stats → XP, level, streak, cached totals
    supabase
      .from("student_stats")
      .select("xp, streak, level, total_assessments, total_questions_answered")
      .eq("user_id", userId)
      .single(),

    // Live count of completed assessments
    supabase
      .from("assessments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),

    // Live count of total responses
    supabase
      .from("assessment_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    // Last 7 days of responses (only answered_at needed)
    (() => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);
      return supabase
        .from("assessment_responses")
        .select("answered_at")
        .eq("user_id", userId)
        .gte("answered_at", since.toISOString());
    })(),

    // Strong topics (mastery ≥ 70, ignoring subject-level rows where topic='')
    supabase
      .from("topic_mastery")
      .select("topic, subject, mastery_pct")
      .eq("user_id", userId)
      .neq("topic", "")
      .gte("mastery_pct", 70)
      .order("mastery_pct", { ascending: false })
      .limit(6),
  ]);

  // ── Parse stats row ──
  const statsData =
    statsResult.status === "fulfilled" ? statsResult.value.data : null;

  // ── Parse counts ──
  const totalAssessments =
    assessmentCountResult.status === "fulfilled"
      ? (assessmentCountResult.value.count ?? statsData?.total_assessments ?? 0)
      : (statsData?.total_assessments ?? 0);

  const questionsAnswered =
    responseCountResult.status === "fulfilled"
      ? (responseCountResult.value.count ?? statsData?.total_questions_answered ?? 0)
      : (statsData?.total_questions_answered ?? 0);

  // ── Build daily activity ──
  const dayKeys: string[] = [];
  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${DAY_LABELS[d.getDay()]} ${d.getDate()}`;
    dayMap.set(key, 0);
    dayKeys.push(key);
  }

  if (activityResult.status === "fulfilled") {
    for (const r of activityResult.value.data ?? []) {
      const d = new Date(r.answered_at);
      const key = `${DAY_LABELS[d.getDay()]} ${d.getDate()}`;
      if (dayMap.has(key)) dayMap.set(key, dayMap.get(key)! + 1);
    }
  }

  const dailyActivity: DayActivity[] = dayKeys.map((k) => ({
    day: k,
    questions: dayMap.get(k) ?? 0,
  }));

  // ── Parse strong topics ──
  const strongTopics: StrongTopic[] =
    strongResult.status === "fulfilled"
      ? (strongResult.value.data ?? []).map((r: any) => ({
          topic: r.topic,
          subject: r.subject,
          masteryPct: r.mastery_pct,
        }))
      : [];

  return {
    totalAssessments,
    questionsAnswered,
    xpEarned: statsData?.xp ?? 0,
    level: statsData?.level ?? 1,
    streak: statsData?.streak ?? 0,
    dailyActivity,
    strongTopics,
  };
}

export function useAssessmentActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<DashboardStats | null>({
    queryKey: QUERY_KEY(user?.id),
    queryFn: async () => (user ? fetchDashboardStats(user.id) : null),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2-min cache
    refetchOnWindowFocus: true,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY(user?.id) });
  }

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    invalidate,
  };
}
