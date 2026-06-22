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
} from "lucide-react";

interface AssessmentReportProps {
  report: AssessmentReport;
  onRetake: () => void;
}

const COLORS = ["#6EC1E4", "#90EE90", "#FFD93D", "#B57EDC", "#FF6F61"];

export default function AssessmentReportCard({ report, onRetake }: AssessmentReportProps) {
  const profileData = [
    { metric: "Retention", value: report.updatedProfile.retention },
    { metric: "Application", value: report.updatedProfile.application },
    { metric: "Grasping", value: report.updatedProfile.grasping },
    { metric: "Speed", value: report.updatedProfile.speed },
  ];

  const grade =
    report.overallScore >= 80
      ? { label: "Excellent", cls: "text-veda-mint" }
      : report.overallScore >= 60
      ? { label: "Good", cls: "text-veda-sky" }
      : report.overallScore >= 40
      ? { label: "Keep Going", cls: "text-veda-yellow" }
      : { label: "Needs Work", cls: "text-veda-coral" };

  return (
    <div className="space-y-6">
      {/* ── Hero Score ── */}
      <div className="rounded-3xl border bg-gradient-to-br from-veda-sky/30 via-veda-mint/20 to-veda-lavender/20 p-8 text-center shadow-soft-lg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {["🌟", "⭐", "✨", "🎉", "🎊"].map((e, i) => (
            <span
              key={i}
              className="absolute text-2xl opacity-20 animate-float"
              style={{
                top: `${10 + i * 18}%`,
                left: `${5 + i * 20}%`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {e}
            </span>
          ))}
        </div>
        <Trophy size={40} className="text-veda-yellow mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground mb-1">Assessment Complete!</p>
        <div className="text-6xl font-extrabold mb-1">
          <span className={grade.cls}>{report.overallScore}%</span>
        </div>
        <p className={`text-lg font-bold ${grade.cls}`}>{grade.label}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {report.correctAnswers} / {report.totalQuestions} correct
        </p>

        {/* XP Badge */}
        <div className="inline-flex items-center gap-1.5 mt-4 rounded-full bg-veda-yellow/20 border border-veda-yellow/40 px-4 py-1.5 text-sm font-bold text-veda-yellow">
          <Zap size={14} />+{report.xpEarned} XP earned
        </div>
      </div>

      {/* ── Learning Profile ── */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-bold text-base mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-veda-lavender" /> Learning Profile Update
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {profileData.map((d) => (
            <div
              key={d.metric}
              className="rounded-2xl border bg-muted/40 p-3 text-center space-y-1"
            >
              <div className="text-2xl font-extrabold text-veda-sky">{d.value}%</div>
              <div className="text-[11px] text-muted-foreground font-medium">{d.metric}</div>
            </div>
          ))}
        </div>
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

      {/* ── Topic Performance ── */}
      {report.topicBreakdown.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-veda-sky" /> Topic Performance
          </h2>
          <div className="w-full h-48">
            <ResponsiveContainer>
              <BarChart
                data={report.topicBreakdown}
                margin={{ left: 0, right: 8, top: 8, bottom: 8 }}
              >
                <XAxis dataKey="topic" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`${v}%`, "Mastery"]} />
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

      {/* ── Strengths & Weaknesses ── */}
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

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetake}
          className="flex-1 rounded-2xl bg-veda-coral text-white py-3 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all"
        >
          🔄 Retake Assessment
        </button>
        <Link
          to="/mistakes"
          className="flex-1 rounded-2xl bg-veda-lavender text-white py-3 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all text-center"
        >
          📖 Review Mistakes
        </Link>
        <Link
          to="/"
          className="flex-1 rounded-2xl border bg-card py-3 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all text-center"
        >
          🏠 Dashboard
        </Link>
      </div>
    </div>
  );
}
