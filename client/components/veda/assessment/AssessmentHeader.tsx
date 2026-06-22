import { Difficulty, Subject } from "@shared/coreTypes";
import { Brain, Zap, BookOpen, TrendingUp } from "lucide-react";

interface AssessmentHeaderProps {
  questionIndex: number;
  totalQuestions: number;
  difficulty: Difficulty;
  subject: Subject;
  correctSoFar: number;
}

const DIFFICULTY_CONFIG = {
  Easy: { label: "Easy", cls: "bg-veda-mint/20 text-veda-mint border-veda-mint/30" },
  Medium: { label: "Medium", cls: "bg-veda-yellow/20 text-veda-yellow border-veda-yellow/30" },
  Hard: { label: "Hard", cls: "bg-veda-coral/20 text-veda-coral border-veda-coral/30" },
};

export default function AssessmentHeader({
  questionIndex,
  totalQuestions,
  difficulty,
  subject,
  correctSoFar,
}: AssessmentHeaderProps) {
  const pct = Math.round((questionIndex / totalQuestions) * 100);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const accuracy = questionIndex > 0 ? Math.round((correctSoFar / questionIndex) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Top row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Subject + difficulty */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-2xl bg-veda-lavender/15 border border-veda-lavender/25 px-3 py-1.5 text-xs font-semibold text-veda-lavender">
            <Brain size={12} />
            {subject}
          </span>
          <span className={`rounded-2xl border px-3 py-1.5 text-xs font-bold ${cfg.cls} transition-all duration-300`}>
            <TrendingUp size={12} className="inline mr-1" />
            {cfg.label}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {questionIndex + 1} / {totalQuestions}
          </span>
          {questionIndex > 0 && (
            <span className="flex items-center gap-1 text-veda-mint font-semibold">
              <Zap size={12} />
              {accuracy}% accuracy
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-veda-sky to-veda-mint transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
