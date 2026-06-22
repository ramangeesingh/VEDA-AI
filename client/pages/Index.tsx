import MainLayout from "@/components/layouts/MainLayout";
import { DailyProgressRing, WeeklyPerformance, FundamentalsRadar } from "@/components/veda/Charts";
import PersonalizedHero from "@/components/veda/PersonalizedHero";
import LearningProfileCard from "@/components/veda/profile/LearningProfileCard";
import MasteryGrid from "@/components/veda/profile/MasteryGrid";
import { useLearningProfile } from "@/hooks/useLearningProfile";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, AlertCircle, Zap, Sparkles, Brain } from "lucide-react";
import { Link } from "react-router-dom";

// ─── Shared card shell ────────────────────────────────────────────────────────

function DashCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-card text-card-foreground p-5 shadow-soft hover:shadow-soft-lg transition-all ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-base">{label}</h2>
      </div>
      {sub && <span className="text-[10px] text-muted-foreground italic">{sub}</span>}
    </div>
  );
}

// ─── AI Insight Cards (live data) ─────────────────────────────────────────────

function LearningPathCard() {
  const { masteryScores } = useLearningProfile();

  // Sort by mastery ascending — lowest mastery = highest priority
  const topicScores = masteryScores
    .filter((m) => m.topic !== "")
    .sort((a, b) => a.masteryPct - b.masteryPct)
    .slice(0, 3);

  const BADGE_MAP = (pct: number) =>
    pct < 40
      ? { label: "Needs Work",  cls: "bg-veda-coral/15 text-veda-coral" }
      : pct < 70
      ? { label: "In Progress", cls: "bg-veda-yellow/20 text-veda-yellow" }
      : { label: "On Track",    cls: "bg-veda-mint/20 text-veda-mint" };

  // Fallback topics when no data yet
  const fallback = [
    { num: 1, name: "Fractions",  badge: { label: "Next Up",   cls: "bg-veda-sky/20 text-veda-sky" } },
    { num: 2, name: "Algebra",    badge: { label: "Needs Work", cls: "bg-veda-coral/15 text-veda-coral" } },
    { num: 3, name: "Geometry",   badge: { label: "Upcoming",  cls: "bg-veda-mint/20 text-veda-mint" } },
  ];

  const topics =
    topicScores.length > 0
      ? topicScores.map((m, i) => ({
          num: i + 1,
          name: m.topic,
          badge: BADGE_MAP(m.masteryPct),
        }))
      : fallback;

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
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${t.badge.cls}`}>
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

  // Use live weak topics if available, fallback to mastery-derived
  const items =
    weakTopics.length > 0
      ? weakTopics.slice(0, 3).map((w) => {
          const mastery = masteryScores.find((m) => m.topic === w.topic)?.masteryPct ?? 30;
          const color =
            w.severity === "critical"
              ? "bg-veda-coral"
              : w.severity === "moderate"
              ? "bg-veda-yellow"
              : "bg-veda-mint";
          return { name: w.topic, pct: Math.round(mastery), color };
        })
      : [
          { name: "Algebra",       pct: 38, color: "bg-veda-coral" },
          { name: "Word Problems", pct: 52, color: "bg-veda-yellow" },
          { name: "Geometry",      pct: 61, color: "bg-veda-mint" },
        ];

  return (
    <DashCard>
      <SectionLabel
        icon={<AlertCircle size={16} className="text-veda-coral" />}
        label="Weak Concepts"
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

function RecommendedPracticeCard() {
  const { weakTopics } = useLearningProfile();
  const topWeak = weakTopics[0];

  const items = [
    { icon: "🎯", label: "Questions",  value: "15 Questions" },
    { icon: "⏱️", label: "Duration",   value: "~10 Minutes"  },
    { icon: "⚡", label: "Difficulty", value: topWeak?.severity === "critical" ? "Easy" : "Medium" },
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

function ChartCard({ title, subtitle, color, children }: {
  title: string; subtitle: string; color: "sky" | "mint" | "coral"; children: React.ReactNode;
}) {
  const tone = { sky: "text-veda-sky", mint: "text-veda-mint", coral: "text-veda-coral" }[color];
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
  const { profile, masteryScores, weakTopics, isLoading } = useLearningProfile();

  return (
    <MainLayout>
      {/* ── Hero: Personalized command center ── */}
      <PersonalizedHero />

      {/* ── AI Insight row ── */}
      <section id="ai-insights" className="mt-10 grid md:grid-cols-3 gap-6">
        <LearningPathCard />
        <WeakConceptsCard />
        <RecommendedPracticeCard />
      </section>

      {/* ── Learning Profile + Mastery (shown when logged in and has data) ── */}
      {user && (
        <section id="learning-profile" className="mt-8 grid md:grid-cols-[1fr_2fr] gap-6 items-start">
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
                  <p className="text-sm text-muted-foreground">Take your first assessment to build your learning profile.</p>
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

      {/* ── Analytics row ── */}
      <section id="charts" className="mt-8 grid md:grid-cols-3 gap-6">
        <ChartCard title="Daily Practice" subtitle="Great job! 72% done today" color="sky">
          <DailyProgressRing value={72} />
        </ChartCard>
        <ChartCard title="Weekly Performance" subtitle="Steady improvement this week" color="coral">
          <WeeklyPerformance />
        </ChartCard>
        <ChartCard title="Fundamentals" subtitle="Balanced skill profile" color="mint">
          <FundamentalsRadar />
        </ChartCard>
      </section>
    </MainLayout>
  );
}
