import MainLayout from "@/components/layouts/MainLayout";
import { DailyProgressRing, WeeklyPerformance, FundamentalsRadar } from "@/components/veda/Charts";
import PersonalizedHero from "@/components/veda/PersonalizedHero";
import { BookOpen, AlertCircle, Zap, Sparkles } from "lucide-react";

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

// ─── AI Insight cards ─────────────────────────────────────────────────────────

function LearningPathCard() {
  const topics = [
    { num: 1, name: "Fractions",  badge: "Next Up",    badgeCls: "bg-veda-sky/20 text-veda-sky" },
    { num: 2, name: "Algebra",    badge: "Needs Work",  badgeCls: "bg-veda-coral/15 text-veda-coral" },
    { num: 3, name: "Geometry",   badge: "Upcoming",    badgeCls: "bg-veda-mint/20 text-veda-mint" },
  ];
  return (
    <DashCard>
      <SectionLabel
        icon={<BookOpen size={16} className="text-veda-sky" />}
        label="Learning Path"
        sub="AI generated"
      />
      <ol className="space-y-3">
        {topics.map(t => (
          <li key={t.num} className="flex items-center gap-3">
            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {t.num}
            </span>
            <span className="flex-1 text-sm font-semibold">{t.name}</span>
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${t.badgeCls}`}>{t.badge}</span>
          </li>
        ))}
      </ol>
    </DashCard>
  );
}

function WeakConceptsCard() {
  const concepts = [
    { name: "Algebra",       pct: 38, color: "bg-veda-coral" },
    { name: "Word Problems", pct: 52, color: "bg-veda-yellow" },
    { name: "Geometry",      pct: 61, color: "bg-veda-mint"  },
  ];
  return (
    <DashCard>
      <SectionLabel
        icon={<AlertCircle size={16} className="text-veda-coral" />}
        label="Weak Concepts"
        sub="Based on recent tests"
      />
      <ul className="space-y-3">
        {concepts.map(c => (
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
  const items = [
    { icon: "🎯", label: "Questions",  value: "15 Questions" },
    { icon: "⏱️", label: "Duration",   value: "~10 Minutes"  },
    { icon: "⚡", label: "Difficulty", value: "Medium"       },
  ];
  return (
    <DashCard className="flex flex-col">
      <SectionLabel
        icon={<Zap size={16} className="text-veda-yellow" />}
        label="Recommended Practice"
        sub="AI selected"
      />
      <ul className="space-y-2 mb-4 flex-1">
        {items.map(it => (
          <li key={it.label} className="flex items-center gap-3 text-sm">
            <span className="text-base">{it.icon}</span>
            <span className="text-muted-foreground text-xs w-16">{it.label}</span>
            <span className="font-semibold">{it.value}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2 border-t border-border/40 flex items-center gap-1.5">
        <Sparkles size={12} className="text-veda-lavender" />
        <p className="text-[10px] text-muted-foreground italic">
          Adaptive session targeting your weak spots.
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
