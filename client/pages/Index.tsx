import { useEffect, useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { DailyProgressRing, WeeklyPerformance, FundamentalsRadar, MiniBarTrend } from "@/components/veda/Charts";
import { Sparkles, Trophy, Puzzle, Star, BookOpenText, Headphones, Bot } from "lucide-react";

const mascotUrl = "https://cdn.builder.io/api/v1/image/assets%2F39ee7dd62eee466082afcbad8171f571%2F77199b25987844ab938408565f3aab51?format=webp&width=800";

export default function Index() {
  // playful rainbow on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <MainLayout>
      {/* Hero */}
      <section id="get-started" className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-10 bg-gradient-to-br from-veda-sky/40 via-veda-mint/30 to-veda-lavender/30 border shadow-soft-lg">
        <Doodles />
        <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-veda-yellow px-3 py-1 text-xs font-semibold text-veda-primary-ink shadow-soft">
              <Sparkles size={14} /> AI‑powered Adaptive Learning
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Welcome to <span className="text-veda-coral">Veda</span> — learn your way!
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-prose">
              A playful, smart platform for Nursery to Class 12. Practice at your pace, earn XP, and level up every day.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#features" className="rounded-2xl bg-veda-coral text-white px-5 py-3 font-semibold shadow-soft hover:shadow-soft-lg transition-all active:scale-95">Explore Features</a>
              <a href="#charts" className="rounded-2xl bg-foreground text-background px-5 py-3 font-semibold shadow-soft hover:shadow-soft-lg transition-all active:scale-95">See Progress</a>
            </div>
          </div>
          <div className="relative">
            <img src={mascotUrl} alt="Veda teacher mascot" className={`w-60 sm:w-72 md:w-80 mx-auto drop-shadow-xl transition-all ${mounted?"opacity-100 translate-y-0":"opacity-0 translate-y-3"}`} />
            <Bubble />
          </div>
        </div>
      </section>

      {/* Modes & Gamification */}
      <section id="features" className="mt-12 grid md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-veda-sky/20 p-3 text-veda-sky shadow-soft"><TargetIcon /></div>
            <h3 className="text-xl font-bold">Practice Modes</h3>
          </div>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>🎯 Quick Practice</li>
            <li>📚 Custom Practice</li>
            <li>🔥 Challenge Mode</li>
          </ul>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-veda-yellow/30 p-3 text-veda-yellow shadow-soft"><Trophy /></div>
            <h3 className="text-xl font-bold">Gamification</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Earn XP, maintain streaks, collect badges and climb leaderboards.</p>
          <MiniBarTrend />
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-veda-lavender/20 p-3 text-veda-lavender shadow-soft"><Bot /></div>
            <h3 className="text-xl font-bold">AI Tutor</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Ask questions and get friendly explanations instantly.</p>
        </Card>
      </section>

      {/* Progress Preview */}
      <section id="charts" className="mt-12 grid md:grid-cols-3 gap-6">
        <ChartCard title="Daily Practice" subtitle="Great job! 72% done today" color="sky">
          <DailyProgressRing value={72} />
        </ChartCard>
        <ChartCard title="Weekly Performance" subtitle="Steady improvement" color="coral">
          <WeeklyPerformance />
        </ChartCard>
        <ChartCard title="Fundamentals" subtitle="Balanced skills" color="mint">
          <FundamentalsRadar />
        </ChartCard>
      </section>

      {/* Roles */}
      <section id="roles" className="mt-12 grid md:grid-cols-3 gap-6">
        <RoleCard icon={<BookOpenText />} title="Student">
          Adaptive quizzes that get harder or easier as you answer.
        </RoleCard>
        <RoleCard icon={<Star />} title="Teacher">
          Class dashboards, heatmaps, insights and quiz assignments.
        </RoleCard>
        <RoleCard icon={<Headphones />} title="Parent">
          Friendly insights and weekly improvement tips.
        </RoleCard>
      </section>
    </MainLayout>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-soft hover:shadow-soft-lg transition-all">
      {children}
    </div>
  );
}

function ChartCard({ title, subtitle, color, children }: { title: string; subtitle: string; color: "sky"|"mint"|"coral"; children: React.ReactNode }) {
  const tone = {
    sky: "text-veda-sky",
    mint: "text-veda-mint",
    coral: "text-veda-coral",
  }[color];
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft hover:shadow-soft-lg transition-all">
      <div className={`font-bold ${tone}`}>{title}</div>
      <div className="text-sm text-muted-foreground mb-2">{subtitle}</div>
      {children}
    </div>
  );
}

function RoleCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft hover:shadow-soft-lg transition-all">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-veda-mint/25 p-3 text-veda-mint shadow-soft">{icon}</div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Bubble() {
  return (
    <div className="absolute right-2 sm:right-4 md:right-0 top-0 -translate-y-4 sm:-translate-y-6 md:translate-x-8 md:-translate-y-10 w-56 md:w-64 rounded-2xl bg-white text-veda-primary-ink shadow-soft-lg p-4 border z-20">
      <p className="text-sm">Hi! I’m your learning guide. Ready to start your journey with Veda?</p>
      <span className="hidden md:block absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rotate-45 bg-white border-l border-t" />
    </div>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}

function Doodles() {
  return (
    <svg className="pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="3" fill="currentColor" className="text-veda-lavender" />
        </pattern>
        <pattern id="books" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <text x="10" y="30" fontSize="24">📚</text>
          <text x="70" y="90" fontSize="24">⭐</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
      <rect width="100%" height="100%" fill="url(#books)" />
    </svg>
  );
}
