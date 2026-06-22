import { Link } from "react-router-dom";
import { MasteryScore, WeakTopic } from "@shared/coreTypes";
import { AlertCircle, TrendingUp } from "lucide-react";

interface MasteryGridProps {
  masteryScores: MasteryScore[];
  weakTopics: WeakTopic[];
}

const SUBJECT_COLORS: Record<string, string> = {
  Math:    "from-veda-sky/30 to-veda-sky/5 border-veda-sky/30",
  Science: "from-veda-mint/30 to-veda-mint/5 border-veda-mint/30",
  English: "from-veda-lavender/30 to-veda-lavender/5 border-veda-lavender/30",
  Mixed:   "from-veda-coral/30 to-veda-coral/5 border-veda-coral/30",
};

const BAR_COLORS: Record<string, string> = {
  Math:    "bg-veda-sky",
  Science: "bg-veda-mint",
  English: "bg-veda-lavender",
  Mixed:   "bg-veda-coral",
};

const SEVERITY_CONFIG = {
  critical: { dot: "bg-veda-coral", label: "Critical" },
  moderate: { dot: "bg-veda-yellow", label: "Moderate" },
  mild:     { dot: "bg-veda-mint", label: "Mild" },
};

export default function MasteryGrid({ masteryScores, weakTopics }: MasteryGridProps) {
  // Group by subject
  const subjectScores = masteryScores.filter((m) => m.topic === "");
  const topicScores   = masteryScores.filter((m) => m.topic !== "");

  // Group topics by subject
  const bySubject = topicScores.reduce((acc, m) => {
    if (!acc[m.subject]) acc[m.subject] = [];
    acc[m.subject].push(m);
    return acc;
  }, {} as Record<string, MasteryScore[]>);

  return (
    <div className="space-y-6">
      {/* ── Subject Mastery ── */}
      {subjectScores.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="font-bold text-base flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-veda-sky" />
            Subject Mastery
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {subjectScores.map((m) => {
              const bar = BAR_COLORS[m.subject] ?? "bg-veda-sky";
              const grad = SUBJECT_COLORS[m.subject] ?? SUBJECT_COLORS.Mixed;
              return (
                <div key={m.subject} className={`rounded-2xl border bg-gradient-to-br ${grad} p-4`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">{m.subject}</span>
                    <span className="text-xl font-extrabold">{Math.round(m.masteryPct)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-background/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar} transition-all duration-700`}
                      style={{ width: `${m.masteryPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {m.attempts} assessment{m.attempts !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Topic Mastery by Subject ── */}
      {Object.keys(bySubject).map((subject) => {
        const topics = bySubject[subject].sort((a, b) => a.masteryPct - b.masteryPct);
        return (
          <div key={subject} className="rounded-2xl border bg-card p-6 shadow-soft">
            <h3 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
              {subject} — Topics
            </h3>
            <ul className="space-y-3">
              {topics.map((t) => {
                const bar = BAR_COLORS[t.subject] ?? "bg-veda-sky";
                return (
                  <li key={t.topic}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{t.topic}</span>
                      <span className="text-muted-foreground">{Math.round(t.masteryPct)}%</span>
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
          </div>
        );
      })}

      {/* ── Weak Topics ── */}
      {weakTopics.length > 0 && (
        <div className="rounded-2xl border bg-veda-coral/10 border-veda-coral/30 p-6 shadow-soft">
          <h2 className="font-bold text-base flex items-center gap-2 mb-4 text-veda-coral">
            <AlertCircle size={16} />
            Weak Topics Detected
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {weakTopics.map((w) => {
              const cfg = SEVERITY_CONFIG[w.severity];
              return (
                <Link
                  key={`${w.subject}-${w.topic}`}
                  to={`/assessment?subject=${w.subject}`}
                  className="flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 hover:bg-card hover:shadow-soft transition-all"
                >
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{w.topic}</div>
                    <div className="text-[10px] text-muted-foreground">{w.subject} · {cfg.label}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Practice →</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {subjectScores.length === 0 && topicScores.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
          <p className="text-muted-foreground text-sm mb-3">No mastery data yet.</p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 rounded-2xl bg-veda-sky text-white px-4 py-2 font-semibold shadow-soft hover:shadow-soft-lg transition-all text-sm"
          >
            Take your first assessment →
          </Link>
        </div>
      )}
    </div>
  );
}
