import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Zap } from "lucide-react";

interface ResultFeedbackProps {
  isCorrect: boolean;
  correctLabel: string;
  xpEarned: number;
  responseTimeMs: number;
  onNext: () => void;
  isLast: boolean;
}

export default function ResultFeedback({
  isCorrect,
  correctLabel,
  xpEarned,
  responseTimeMs,
  onNext,
  isLast,
}: ResultFeedbackProps) {
  const [xpVisible, setXpVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setXpVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  const seconds = (responseTimeMs / 1000).toFixed(1);

  return (
    <div
      className={[
        "rounded-2xl border p-6 shadow-soft transition-all duration-300",
        isCorrect
          ? "bg-veda-mint/10 border-veda-mint/40"
          : "bg-veda-coral/10 border-veda-coral/40",
      ].join(" ")}
    >
      {/* Icon + message */}
      <div className="flex items-center gap-3 mb-4">
        {isCorrect ? (
          <CheckCircle2 size={28} className="text-veda-mint shrink-0" />
        ) : (
          <XCircle size={28} className="text-veda-coral shrink-0" />
        )}
        <div>
          <p className="font-bold text-base">
            {isCorrect ? "Correct! Well done! 🎉" : "Not quite — keep going! 💪"}
          </p>
          {!isCorrect && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Correct answer: <span className="font-semibold text-foreground">{correctLabel}</span>
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5">
        <span>⏱ {seconds}s</span>
        {isCorrect && xpEarned > 0 && (
          <span
            className={`flex items-center gap-1 font-bold text-veda-yellow transition-all duration-500 ${
              xpVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <Zap size={12} />+{xpEarned} XP
          </span>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full rounded-2xl bg-gradient-to-r from-veda-sky to-veda-lavender text-white py-3 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all"
      >
        {isLast ? "View My Report 📊" : "Next Question →"}
      </button>
    </div>
  );
}
