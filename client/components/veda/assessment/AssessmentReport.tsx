import { Link } from "react-router-dom";
import { AssessmentReport } from "@shared/coreTypes";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Zap,
  BookOpen,
  AlertCircle,
  Brain,
  Clock,
  Target,
  Flame,
} from "lucide-react";

interface AssessmentReportProps {
  report: AssessmentReport;
  onRetake: () => void;
}

const COLORS = ["#6EC1E4", "#90EE90", "#FFD93D", "#B57EDC", "#FF6F61", "#7EC8E3"];

// XP to level
function xpToLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 150) + 1);
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function AssessmentReportCard({ report, onRetake }: AssessmentReportProps) {
  const accuracy = report.totalQuestions > 0
    ? Math.round((report.correctAnswers / report.totalQuestions) * 100)
    : 0;

  const avgResponseSec = report.timeTakenMs > 0 && report.totalQuestions > 0
    ? Math.round(report.timeTakenMs / report.totalQuestions / 1000)
    : 0;

  const grade =
    report.overallScore >= 80
      ? { label: "Excellent! 🌟", cls: "text-veda-mint", emoji: "🏆" }
      : report.overallScore >= 60
      ? { label: "Good Job! 👏", cls: "text-veda-sky", emoji: "⭐" }
      : report.overallScore >= 40
      ? { label: "Keep Going! 💪", cls: "text-veda-yellow", emoji: "📈" }
      : { label: "Needs Practice", cls: "text-veda-coral", emoji: "📚" };

  const profileData = [
    { metric: "Retention",   value: report.updatedProfile.retention },
    { metric: "Application", value: report.updatedProfile.application },
    { metric: "Grasping",    value: report.updatedProfile.grasping },
    { metric: "Speed",       value: report.updatedProfile.speed },
  ];

  // Accuracy metric cards
  const metricCards = [
    {
      icon: <Target size={16} className="text-veda-sky" />,
      label: "Overall Score",
      value: `${report.overallScore}%`,
      sub: `${report.correctAnswers}/${report.totalQuestions} correct`,
      bg: "bg-veda-sky/10 border-veda-sky/25",
    },
    {
      icon: <CheckCircle2 size={16} className="text-veda-mint" />,
      label: "Accuracy",
      value: `${accuracy}%`,
      sub: accuracy >= 80 ? "Excellent!" : accuracy >= 60 ? "Good work" : "Keep practicing",
      bg: "bg-veda-mint/10 border-veda-mint/25",
    },
    {
      icon: <Clock size={16} className="text-veda-lavender" />,
      label: "Avg Speed",
      value: `${avgResponseSec}s`,
      sub: avgResponseSec < 10 ? "Very fast!" : avgResponseSec < 20 ? "Good pace" : "Take your time",
      bg: "bg-veda-lavender/10 border-veda-lavender/25",
    },
    {
      icon: <Flame size={16} className="text-veda-coral" />,
      label: "Time Taken",
      value: formatTime(report.timeTakenMs),
      sub: `${report.totalQuestions} questions`,
      bg: "bg-veda-coral/10 border-veda-coral/25",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Hero Score ── */}
      <div className="rounded-3xl border bg-gradient-to-br from-veda-sky/30 via-veda-mint/20 to-veda-lavender/20 p-8 text-center shadow-soft-lg relative overflow-hidden">
        {/* Floating emojis */}
        <div className="absolute inset-0 pointer-events-none">
          {["🌟", "⭐", "✨", "🎉", "🎊"].map((e, i) => (
            <span
              key={i}
              className="absolute text-2xl opacity-20 animate-float"
              style={{ top: `${10 + i * 18}%`, left: `${5 + i * 20}%`, animationDelay: `${i * 0.4}s` }}
            >
              {e}
            </span>
          ))}
        </div>

        <div className="text-4xl mb-3">{grade.emoji}</div>
        <p className="text-sm font-semibold text-muted-foreground mb-1">Assessment Complete!</p>
        <div className="text-7xl font-extrabold mb-1">
          <span className={grade.cls}>{report.overallScore}%</span>
        </div>
        <p className={`text-xl font-bold ${grade.cls}`}>{grade.label}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {report.correctAnswers} correct out of {report.totalQuestions} questions
        </p>

        {/* XP + Level badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-veda-yellow/20 border border-veda-yellow/40 px-4 py-1.5 text-sm font-bold text-veda-yellow">
            <Zap size={14} />+{report.xpEarned} XP
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-veda-lavender/20 border border-veda-lavender/40 px-4 py-1.5 text-sm font-bold text-veda-lavender">
            <Trophy size={14} />Level {xpToLevel(report.xpEarned)}+ progress
          </div>
        </div>
      </div>

      {/* ── Performance Metrics ── */}
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((m) => (
          <div key={m.label} className={`rounded-2xl border p-4 ${m.bg} space-y-1`}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              {m.icon} {m.label}
            </div>
            <div className="text-2xl font-extrabold">{m.value}</div>
            <div className="text-[11px] text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Learning Profile Update ── */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-bold text-base mb-4 flex items-center gap-2">
          <Brain size={16} className="text-veda-lavender" /> Learning Profile Update
        </h2>

        {/* Dimension chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Retention",   value: report.updatedProfile.retention,   color: "text-veda-sky",      hint: "Topic recall across sessions" },
            { label: "Application", value: report.updatedProfile.application, color: "text-veda-coral",    hint: "Hard question performance" },
            { label: "Grasping",    value: report.updatedProfile.grasping,    color: "text-veda-mint",     hint: "Speed-weighted accuracy" },
            { label: "Speed",       value: report.updatedProfile.speed,       color: "text-veda-lavender", hint: "Answer response rate" },
          ].map((d) => (
            <div key={d.label} className="rounded-2xl border bg-muted/40 p-3 text-center space-y-1">
              <div className={`text-2xl font-extrabold ${d.color}`}>{d.value}%</div>
              <div className="text-[11px] text-muted-foreground font-medium">{d.label}</div>
            </div>
          ))}
        </div>

        {/* Radar chart */}
        <div className="w-full h-48">
          <ResponsiveContainer>
            <RadarChart data={profileData} outerRadius={70}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar dataKey="value" stroke="#6EC1E4" fill="#6EC1E4" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Topic Performance Bar Chart ── */}
      {report.topicBreakdown.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-veda-sky" /> Topic Performance
          </h2>
          <div className="w-full h-48">
            <ResponsiveContainer>
              <BarChart
                data={report.topicBreakdown}
                margin={{ left: 0, right: 8, top: 8, bottom: 8 }}
              >
                <XAxis dataKey="topic" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, "Mastery"]}
                  contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                />
                <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                  {report.topicBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Subject Breakdown ── */}
      {report.subjectBreakdown.length > 1 && (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-veda-mint" /> Subject Breakdown
          </h2>
          <div className="space-y-3">
            {report.subjectBreakdown.map((s) => (
              <div key={s.subject}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold">{s.subject}</span>
                  <span className="text-muted-foreground">{s.correct}/{s.total} — {s.percentage}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-veda-sky to-veda-mint transition-all duration-700"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Strengths & Weak Topics ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-veda-mint/10 border-veda-mint/30 p-5 shadow-soft">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-veda-mint">
            <CheckCircle2 size={15} /> Strong Topics
          </h3>
          {report.strengthTopics.length > 0 ? (
            <ul className="space-y-1.5">
              {report.strengthTopics.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-veda-mint shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Keep practicing to build strengths!</p>
          )}
        </div>

        <div className="rounded-2xl border bg-veda-coral/10 border-veda-coral/30 p-5 shadow-soft">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-veda-coral">
            <AlertCircle size={15} /> Needs Practice
          </h3>
          {report.weakTopics.length > 0 ? (
            <ul className="space-y-1.5">
              {report.weakTopics.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-veda-coral shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Great job! No major weak areas. 🎉</p>
          )}
        </div>
      </div>

      {/* ── Difficulty Progression ── */}
      {report.difficultyProgression.length > 0 && (
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-muted-foreground">
            <TrendingUp size={14} /> Difficulty Progression
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {report.difficultyProgression.map((step, i) => {
              const isCorrect = step.includes("✓");
              const isHard = step.includes("Hard");
              const isMed = step.includes("Medium");
              const bg = isCorrect
                ? isHard ? "bg-veda-coral/20 text-veda-coral" : isMed ? "bg-veda-yellow/20 text-veda-yellow" : "bg-veda-mint/20 text-veda-mint"
                : "bg-muted text-muted-foreground";
              return (
                <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${bg}`}>
                  {step}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="grid sm:grid-cols-3 gap-3 pb-4">
        <button
          onClick={onRetake}
          className="rounded-2xl bg-veda-coral text-white py-3 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all"
        >
          🔄 Retake
        </button>
        <Link
          to="/mistakes"
          className="rounded-2xl bg-veda-lavender text-white py-3 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all text-center"
        >
          📖 Mistakes
        </Link>
        <Link
          to="/"
          className="rounded-2xl border bg-card py-3 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all text-center"
        >
          🏠 Dashboard
        </Link>
      </div>
    </div>
  );
}
