import MainLayout from "@/components/layouts/MainLayout";
import {
  WeeklyPerformance,
  FundamentalsRadar,
  TopicMasteryChart,
  ResponseSpeedChart,
  DailyPracticeChart,
} from "@/components/veda/Charts";
import PersonalizedHero from "@/components/veda/PersonalizedHero";
import LearningProfileCard from "@/components/veda/profile/LearningProfileCard";
import MasteryGrid from "@/components/veda/profile/MasteryGrid";
import { useLearningProfile } from "@/hooks/useLearningProfile";
import { useAssessmentActivity } from "@/hooks/useAssessmentActivity";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  AlertCircle,
  Zap,
  Sparkles,
  Brain,
  TrendingUp,
  Star,
  CheckCircle2,
  Flame,
  Trophy,
  BarChart2,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Shared card shell ────────────────────────────────────────────────────────

function DashCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card text-card-foreground p-5 shadow-soft hover:shadow-soft-lg transition-all ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-base">{label}</h2>
      </div>
      {sub && (
        <span className="text-[10px] text-muted-foreground italic">{sub}</span>
      )}
    </div>
  );
}

// ─── Learning Progress Section ────────────────────────────────────────────────

const PROGRESS_STATS = [
  {
    key: "totalAssessments",
    icon: BarChart2,
    label: "Assessments",
    color: "text-veda-sky",
    bg: "bg-veda-sky/10 border-veda-sky/25",
    suffix: "",
  },
  {
    key: "questionsAnswered",
    icon: CheckCircle2,
    label: "Questions",
    color: "text-veda-mint",
    bg: "bg-veda-mint/10 border-veda-mint/25",
    suffix: "",
  },
  {
    key: "xpEarned",
    icon: Zap,
    label: "XP Earned",
    color: "text-veda-yellow",
    bg: "bg-veda-yellow/10 border-veda-yellow/25",
    suffix: " XP",
  },
  {
    key: "level",
    icon: Trophy,
    label: "Level",
    color: "text-veda-lavender",
    bg: "bg-veda-lavender/10 border-veda-lavender/25",
    suffix: "",
    prefix: "Lv ",
  },
  {
    key: "streak",
    icon: Flame,
    label: "Streak",
    color: "text-veda-coral",
    bg: "bg-veda-coral/10 border-veda-coral/25",
    suffix: "d",
  },
] as const;

function LearningProgressSection() {
  const { stats, isLoading } = useAssessmentActivity();

  // Show a slim skeleton while loading
  if (isLoading) {
    return (
      <section
        id="learning-progress"
        className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
      >
        {PROGRESS_STATS.map((s) => (
          <div
            key={s.key}
            className="rounded-2xl border bg-card p-4 shadow-soft animate-pulse h-20"
          />
        ))}
      </section>
    );
  }

  // No data → empty state
  if (!stats || stats.totalAssessments === 0) {
    return (
      <section id="learning-progress" className="mt-8">
        <div className="rounded-2xl border bg-card p-5 shadow-soft flex items-center gap-4">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="font-bold text-sm">No progress yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete your first assessment to unlock your learning stats.
            </p>
          </div>
          <Link
            to="/assessment"
            className="ml-auto rounded-2xl bg-veda-sky text-white px-4 py-2 text-sm font-semibold shadow-soft hover:shadow-soft-lg transition-all shrink-0"
          >
            Start Now →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      id="learning-progress"
      className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
    >
      {PROGRESS_STATS.map((s) => {
        const Icon = s.icon;
        const raw = stats[s.key as keyof typeof stats] as number;
        const display = `${"prefix" in s ? s.prefix : ""}${raw.toLocaleString()}${s.suffix}`;
        return (
          <div
            key={s.key}
            className={`rounded-2xl border ${s.bg} p-4 flex flex-col gap-1 shadow-soft`}
          >
            <div className="flex items-center gap-1.5">
              <Icon size={13} className={s.color} />
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {s.label}
              </span>
            </div>
            <span className={`text-xl font-extrabold ${s.color}`}>
              {display}
            </span>
          </div>
        );
      })}
    </section>
  );
}

// ─── AI Insight Cards (live data) ─────────────────────────────────────────────

function LearningPathCard() {
  const { masteryScores } = useLearningProfile();

  const topicScores = masteryScores
    .filter((m) => m.topic !== "")
    .sort((a, b) => a.masteryPct - b.masteryPct)
    .slice(0, 3);

  const BADGE_MAP = (pct: number) =>
    pct < 40
      ? { label: "Needs Work", cls: "bg-veda-coral/15 text-veda-coral" }
      : pct < 70
      ? { label: "In Progress", cls: "bg-veda-yellow/20 text-veda-yellow" }
      : { label: "On Track", cls: "bg-veda-mint/20 text-veda-mint" };

  // Empty state when no real data
  if (topicScores.length === 0) {
    return (
      <DashCard>
        <SectionLabel
          icon={<BookOpen size={16} className="text-veda-sky" />}
          label="Learning Path"
          sub="AI generated"
        />
        <div className="flex flex-col items-center justify-center py-5 text-center gap-2">
          <span className="text-2xl">📚</span>
          <p className="text-[11px] text-muted-foreground">
            Complete your first assessment to unlock your personalised learning path.
          </p>
        </div>
      </DashCard>
    );
  }

  const topics = topicScores.map((m, i) => ({
    num: i + 1,
    name: m.topic,
    badge: BADGE_MAP(m.masteryPct),
  }));

  return (
    <DashCard>
      <SectionLabel
        icon={<BookOpen size={16} className="text-veda-sky" />}
        label="Learning Path"
        sub="AI generated"
      />
      <ol className="space-y-3">
        {topics.map((t) => (
          <li key={t.num} className="flex items-center gap-3">
            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {t.num}
            </span>
            <span className="flex-1 text-sm font-semibold">{t.name}</span>
            <span
              className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${t.badge.cls}`}
            >
              {t.badge.label}
            </span>
          </li>
        ))}
      </ol>
    </DashCard>
  );
}

function WeakConceptsCard() {
  const { weakTopics, masteryScores } = useLearningProfile();

  const items = weakTopics.slice(0, 3).map((w) => {
    const mastery =
      masteryScores.find((m) => m.topic === w.topic)?.masteryPct ?? 30;
    const color =
      w.severity === "critical"
        ? "bg-veda-coral"
        : w.severity === "moderate"
        ? "bg-veda-yellow"
        : "bg-veda-mint";
    return { name: w.topic, pct: Math.round(mastery), color };
  });

  // Empty state — no hardcoded fallbacks
  if (items.length === 0) {
    return (
      <DashCard>
        <SectionLabel
          icon={<AlertCircle size={16} className="text-veda-coral" />}
          label="Weak Areas"
          sub="Based on recent tests"
        />
        <div className="flex flex-col items-center justify-center py-5 text-center gap-2">
          <span className="text-2xl">✅</span>
          <p className="text-[11px] text-muted-foreground">
            No weak areas detected yet.
            <br />
            Take an assessment to see where you need help.
          </p>
        </div>
      </DashCard>
    );
  }

  return (
    <DashCard>
      <SectionLabel
        icon={<AlertCircle size={16} className="text-veda-coral" />}
        label="Weak Areas"
        sub="Based on recent tests"
      />
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold">{c.name}</span>
              <span className="text-muted-foreground">{c.pct}% mastery</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${c.color} transition-all duration-700`}
                style={{ width: `${c.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </DashCard>
  );
}

function StrongTopicsCard() {
  const { stats, isLoading } = useAssessmentActivity();

  const SUBJECT_COLOR: Record<string, string> = {
    Math: "bg-veda-sky",
    Science: "bg-veda-mint",
    English: "bg-veda-lavender",
    Mixed: "bg-veda-coral",
  };

  if (isLoading) {
    return (
      <DashCard>
        <SectionLabel
          icon={<Star size={16} className="text-veda-yellow" />}
          label="Strong Areas"
          sub="Your strengths"
        />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </DashCard>
    );
  }

  const strongTopics = stats?.strongTopics ?? [];

  if (strongTopics.length === 0) {
    return (
      <DashCard>
        <SectionLabel
          icon={<Star size={16} className="text-veda-yellow" />}
          label="Strong Areas"
          sub="Your strengths"
        />
        <div className="flex flex-col items-center justify-center py-5 text-center gap-2">
          <span className="text-2xl">⭐</span>
          <p className="text-[11px] text-muted-foreground">
            No strong topics yet.
            <br />
            Score 70%+ on a topic to unlock this section.
          </p>
        </div>
      </DashCard>
    );
  }

  return (
    <DashCard>
      <SectionLabel
        icon={<Star size={16} className="text-veda-yellow" />}
        label="Strong Areas"
        sub="Your strengths"
      />
      <ul className="space-y-3">
        {strongTopics.map((t) => {
          const bar = SUBJECT_COLOR[t.subject] ?? "bg-veda-sky";
          return (
            <li key={`${t.subject}-${t.topic}`}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold">{t.topic}</span>
                <span className="text-muted-foreground">
                  {Math.round(t.masteryPct)}% mastery
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${bar} transition-all duration-700`}
                  style={{ width: `${t.masteryPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </DashCard>
  );
}

function RecommendedPracticeCard() {
  const { weakTopics } = useLearningProfile();
  const topWeak = weakTopics[0];

  const items = [
    { icon: "🎯", label: "Questions", value: "15 Questions" },
    { icon: "⏱️", label: "Duration", value: "~10 Minutes" },
    {
      icon: "⚡",
      label: "Difficulty",
      value: topWeak?.severity === "critical" ? "Easy" : "Medium",
    },
  ];

  return (
    <DashCard className="flex flex-col">
      <SectionLabel
        icon={<Zap size={16} className="text-veda-yellow" />}
        label="Recommended Practice"
        sub="AI selected"
      />
      <ul className="space-y-2 mb-4 flex-1">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-3 text-sm">
            <span className="text-base">{it.icon}</span>
            <span className="text-muted-foreground text-xs w-16">{it.label}</span>
            <span className="font-semibold">{it.value}</span>
          </li>
        ))}
      </ul>
      <Link
        to={topWeak ? `/assessment?subject=${topWeak.subject}` : "/assessment"}
        className="w-full rounded-2xl bg-veda-coral text-white py-2.5 text-sm font-bold text-center shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all"
      >
        Start Practice Session →
      </Link>
      <div className="mt-3 border-t border-border/40 pt-2 flex items-center gap-1.5">
        <Sparkles size={12} className="text-veda-lavender" />
        <p className="text-[10px] text-muted-foreground italic">
          {topWeak
            ? `Targeting your weak spot: ${topWeak.topic}`
            : "Adaptive session targeting your weak spots."}
        </p>
      </div>
    </DashCard>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  color,
  children,
}: {
  title: string;
  subtitle: string;
  color: "sky" | "mint" | "coral" | "yellow" | "lavender";
  children: React.ReactNode;
}) {
  const tone = {
    sky: "text-veda-sky",
    mint: "text-veda-mint",
    coral: "text-veda-coral",
    yellow: "text-veda-yellow",
    lavender: "text-veda-lavender",
  }[color];
  return (
    <DashCard>
      <div className={`font-bold ${tone}`}>{title}</div>
      <div className="text-sm text-muted-foreground mb-3">{subtitle}</div>
      {children}
    </DashCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const { user } = useAuth();
  const { profile, masteryScores, weakTopics, recentAssessments, isLoading } =
    useLearningProfile();
  const { stats: activityStats } = useAssessmentActivity();

  return (
    <MainLayout>
      {/* ── Hero: Personalized command center ── */}
      <PersonalizedHero />

      {/* ── Learning Progress: stat tiles ── */}
      <LearningProgressSection />

      {/* ── AI Insight row: Weak | Strong | Recommended ── */}
      <section id="ai-insights" className="mt-8 grid md:grid-cols-3 gap-6">
        <WeakConceptsCard />
        <StrongTopicsCard />
        <RecommendedPracticeCard />
      </section>

      {/* ── Learning Path (full-width below insight row) ── */}
      <section className="mt-6">
        <LearningPathCard />
      </section>

      {/* ── Learning Profile + Mastery (shown when logged in) ── */}
      {user && (
        <section
          id="learning-profile"
          className="mt-8 grid md:grid-cols-[1fr_2fr] gap-6 items-start"
        >
          {profile && !isLoading ? (
            <LearningProfileCard profile={profile} />
          ) : (
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-veda-lavender" />
                <h2 className="font-bold text-base">Learning Profile</h2>
              </div>
              {isLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-veda-sky border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Take your first assessment to build your learning profile.
                  </p>
                  <Link
                    to="/assessment"
                    className="inline-block rounded-2xl bg-veda-sky text-white px-4 py-2 text-sm font-semibold shadow-soft hover:shadow-soft-lg transition-all"
                  >
                    Start Assessment →
                  </Link>
                </div>
              )}
            </div>
          )}
          <MasteryGrid masteryScores={masteryScores} weakTopics={weakTopics} />
        </section>
      )}

      {/* ── Analytics Charts (6 charts in 2-col grid) ── */}
      <section id="charts" className="mt-8 grid md:grid-cols-2 gap-6">
        {/* Row 1 */}
        <ChartCard
          title="Weekly Performance"
          subtitle="Assessment scores over time"
          color="coral"
        >
          <WeeklyPerformance assessments={recentAssessments} />
        </ChartCard>

        <ChartCard
          title="Daily Practice"
          subtitle="Questions attempted per day (last 7 days)"
          color="sky"
        >
          <DailyPracticeChart
            data={activityStats?.dailyActivity ?? []}
          />
        </ChartCard>

        {/* Row 2 */}
        <ChartCard
          title="Topic Mastery"
          subtitle="Concept mastery breakdown"
          color="mint"
        >
          <TopicMasteryChart masteryScores={masteryScores} />
        </ChartCard>

        <ChartCard
          title="Response Speed"
          subtitle="Average response time per assessment (seconds)"
          color="coral"
        >
          <ResponseSpeedChart assessments={recentAssessments} />
        </ChartCard>

        {/* Row 3 */}
        <ChartCard
          title="Fundamentals"
          subtitle="Cognitive strength profile"
          color="lavender"
        >
          <FundamentalsRadar profile={profile} />
        </ChartCard>

        {/* Placeholder for future chart or CTA */}
        <DashCard className="flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
          <TrendingUp size={32} className="text-veda-mint opacity-60" />
          <p className="font-bold text-sm">Keep Going!</p>
          <p className="text-[11px] text-muted-foreground max-w-[200px]">
            Complete more assessments to unlock deeper analytics and insights.
          </p>
          <Link
            to="/assessment"
            className="mt-1 rounded-2xl bg-veda-mint/20 border border-veda-mint/40 text-veda-mint px-4 py-2 text-xs font-bold hover:bg-veda-mint/30 transition-all"
          >
            Take Assessment →
          </Link>
        </DashCard>
      </section>
    </MainLayout>
  );
}
