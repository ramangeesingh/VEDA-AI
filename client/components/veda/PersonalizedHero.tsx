import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/lib/vedaStore";
import { Flame, Star, Trophy, Target, Brain, Zap, BookOpen, Lightbulb } from "lucide-react";

const mascotUrl =
  "https://cdn.builder.io/api/v1/image/assets%2F39ee7dd62eee466082afcbad8171f571%2F77199b25987844ab938408565f3aab51?format=webp&width=800";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

// ─── Motivational messages (left side, under greeting) ───────────────────────

const MOTIV_MESSAGES = [
  "Your Algebra mastery increased by 8% this week. 📈",
  "You're on a learning streak — stay consistent! 🔥",
  "Let's complete today's mission and level up. 🎯",
  "Your retention score jumped 10% this week. 🧠",
];

function useRotating(arr: string[], interval = 5000) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % arr.length); setVisible(true); }, 350);
    }, interval);
    return () => clearInterval(t);
  }, [arr.length, interval]);
  return { value: arr[idx], visible };
}

// ─── AI Speech Bubble ─────────────────────────────────────────────────────────

const AI_MESSAGES = [
  "You struggled with Algebra yesterday — let's fix that today! 💪",
  "Only 1 question left to finish today's mission. Go! 🎯",
  "Your Fractions mastery is up 12% this week. Keep it up! 🎉",
  "You're close to reaching Level 9 — just 50 XP away! ⭐",
];

function AIBubble() {
  const { value, visible } = useRotating(AI_MESSAGES, 4500);
  return (
    <div
      className={`
        absolute -top-6 right-0 md:-top-10 md:-right-2
        w-56 md:w-64 rounded-2xl shadow-soft-lg p-3.5 border z-20
        bg-card/90 backdrop-blur-md border-veda-sky/30
        transition-all duration-350
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
      `}
    >
      <div className="flex items-start gap-2">
        <span className="shrink-0 rounded-full bg-veda-lavender/20 p-1.5 mt-0.5">
          <Brain size={13} className="text-veda-lavender" />
        </span>
        <p className="text-[11px] leading-relaxed text-foreground font-medium">{value}</p>
      </div>
      {/* tail */}
      <span className="hidden md:block absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-card border-r border-b border-veda-sky/30" />
    </div>
  );
}

// ─── Floating background doodles ─────────────────────────────────────────────

const DOODLES = [
  { ch: "📚", top: "6%",  left: "3%",  delay: "0s",   dur: "4.2s", sz: "text-xl"   },
  { ch: "⭐", top: "12%", left: "72%", delay: "0.7s", dur: "3.8s", sz: "text-lg"   },
  { ch: "✏️", top: "68%", left: "6%",  delay: "1.1s", dur: "4.5s", sz: "text-base" },
  { ch: "💡", top: "62%", left: "87%", delay: "0.3s", dur: "3.6s", sz: "text-xl"   },
  { ch: "∑",  top: "22%", left: "91%", delay: "1.5s", dur: "4.0s", sz: "text-2xl font-bold" },
  { ch: "π",  top: "82%", left: "54%", delay: "1.9s", dur: "3.9s", sz: "text-xl font-bold"  },
  { ch: "🎓", top: "44%", left: "1%",  delay: "0.5s", dur: "4.3s", sz: "text-base" },
  { ch: "📐", top: "88%", left: "18%", delay: "1.3s", dur: "4.1s", sz: "text-sm"   },
  { ch: "🌟", top: "4%",  left: "47%", delay: "2.2s", dur: "3.7s", sz: "text-sm"   },
  { ch: "🔭", top: "50%", left: "93%", delay: "1.7s", dur: "4.4s", sz: "text-base" },
  { ch: "📏", top: "30%", left: "0%",  delay: "0.9s", dur: "3.5s", sz: "text-sm"   },
];

function FloatingDoodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {DOODLES.map((d, i) => (
        <span
          key={i}
          className={`absolute opacity-[0.10] animate-float select-none ${d.sz}`}
          style={{ top: d.top, left: d.left, animationDelay: d.delay, animationDuration: d.dur }}
        >
          {d.ch}
        </span>
      ))}
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon, label, value, iconCls, bgCls,
}: { icon: React.ReactNode; label: string; value: string; iconCls: string; bgCls: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-2xl ${bgCls} px-3 py-2 shadow-soft border`}>
      <span className={`${iconCls} shrink-0`}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground leading-none mb-0.5">{label}</div>
        <div className="text-sm font-bold leading-none truncate">{value}</div>
      </div>
    </div>
  );
}

// ─── Mission card (compact) ───────────────────────────────────────────────────

const TASKS = [
  { label: "Fractions Revision",   done: true  },
  { label: "Practice 10 Questions", done: true  },
  { label: "Adaptive Assessment",   done: false },
];

function MissionCard() {
  const done = TASKS.filter(t => t.done).length;
  const pct  = Math.round((done / TASKS.length) * 100);
  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm px-4 py-3 shadow-soft border-veda-mint/25">
      {/* header */}
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-veda-mint">
          <Target size={11} /> Today's Mission
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold">{done}/{TASKS.length} done</span>
      </div>
      {/* task rows */}
      <ul className="space-y-1 mb-2.5">
        {TASKS.map((t, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              t.done ? "bg-veda-mint border-veda-mint" : "border-muted-foreground/40"
            }`}>
              {t.done && (
                <svg viewBox="0 0 10 10" width="7" height="7" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className={`text-[11px] ${t.done ? "line-through text-muted-foreground" : "font-medium text-foreground"}`}>
              {t.label}
            </span>
          </li>
        ))}
      </ul>
      {/* progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-veda-mint to-veda-sky transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold shrink-0">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Focus Today card ─────────────────────────────────────────────────────────

const FOCUS_TOPICS = [
  { label: "Algebra",       dot: "bg-veda-coral",   priority: "High" },
  { label: "Word Problems", dot: "bg-veda-yellow",  priority: "Medium" },
  { label: "Fractions",     dot: "bg-veda-mint",    priority: "On Track" },
];

function FocusCard() {
  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm px-4 py-3 shadow-soft border-veda-lavender/25">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-veda-lavender">
          <Lightbulb size={11} /> Focus Today
        </span>
        <span className="text-[9px] text-muted-foreground italic">AI selected</span>
      </div>
      <ul className="space-y-1">
        {FOCUS_TOPICS.map((t, i) => (
          <li key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full shrink-0 ${t.dot}`} />
              <span className="text-[11px] font-medium">{t.label}</span>
            </div>
            <span className="text-[9px] text-muted-foreground">{t.priority}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Hero Export ─────────────────────────────────────────────────────────

export default function PersonalizedHero() {
  const { user }  = useAuth();
  const [mounted, setMounted]  = useState(false);
  const [profile, setProfile]  = useState({ xp: 0, streak: 0 });
  const { value: motivMsg, visible: motivVisible } = useRotating(MOTIV_MESSAGES, 5500);

  useEffect(() => {
    setMounted(true);
    setProfile(getProfile());
  }, []);

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Learner";

  const xp       = profile.xp;
  const streak   = profile.streak;
  const level    = getLevel(xp);
  const tasksLeft = TASKS.filter(t => !t.done).length;

  return (
    <section
      id="get-started"
      className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-10 bg-gradient-to-br from-veda-sky/40 via-veda-mint/30 to-veda-lavender/30 border shadow-soft-lg"
    >
      <FloatingDoodles />

      {/* ── 60 / 40 grid ── */}
      <div className="grid md:grid-cols-[3fr_2fr] gap-8 items-start relative z-10">

        {/* ═══════ LEFT ═══════ */}
        <div className="space-y-4">

          {/* Greeting */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-0.5">{getGreeting()} 👋</p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Let's go, <span className="text-veda-coral">{firstName}!</span>
            </h1>
            {/* Rotating motivational sub-line */}
            <p
              className={`mt-1 text-sm text-muted-foreground transition-all duration-350 ${
                motivVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              }`}
            >
              {motivMsg}
            </p>
          </div>

          {/* Stats row — 4 chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatChip icon={<Flame size={14}/>}   label="Streak"    value={`${streak} Days`}           iconCls="text-veda-coral"    bgCls="bg-veda-coral/10 border-veda-coral/20"   />
            <StatChip icon={<Star size={14}/>}    label="XP Points" value={`${xp.toLocaleString()} XP`} iconCls="text-veda-yellow"   bgCls="bg-veda-yellow/10 border-veda-yellow/20"  />
            <StatChip icon={<Trophy size={14}/>}  label="Level"     value={`Level ${level}`}            iconCls="text-veda-lavender" bgCls="bg-veda-lavender/10 border-veda-lavender/20"/>
            <StatChip icon={<Target size={14}/>}  label="Tasks Left" value={`${tasksLeft} Tasks`}       iconCls="text-veda-mint"     bgCls="bg-veda-mint/10 border-veda-mint/20"      />
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/practice"
              className="inline-flex items-center gap-2 rounded-2xl bg-veda-coral text-white px-6 py-3 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.02] transition-all active:scale-95 text-sm"
            >
              <Zap size={16}/> Resume Learning
            </Link>
            <Link
              to="/adaptive-test"
              className="inline-flex items-center gap-2 rounded-2xl bg-veda-lavender text-white px-5 py-3 font-semibold shadow-soft hover:shadow-soft-lg hover:scale-[1.02] transition-all active:scale-95 text-sm"
            >
              <Brain size={16}/> Take Assessment
            </Link>
          </div>

          {/* Mission + Focus — side by side on sm+, stacked on mobile */}
          <div className="grid sm:grid-cols-2 gap-3">
            <MissionCard />
            <FocusCard   />
          </div>
        </div>

        {/* ═══════ RIGHT (mascot) ═══════ */}
        <div className="relative flex flex-col items-center justify-start pt-8 md:pt-4">
          {/* Glow ring behind mascot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 rounded-full bg-veda-sky/20 blur-3xl pointer-events-none" />

          {/* AI speech bubble (above mascot) */}
          <AIBubble />

          {/* Mascot — ~20% larger than before */}
          <img
            src={mascotUrl}
            alt="Veda teacher mascot"
            className={`relative w-72 sm:w-80 md:w-96 lg:w-[26rem] mx-auto drop-shadow-2xl transition-all duration-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          />
        </div>
      </div>
    </section>
  );
}
