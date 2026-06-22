import { useState } from "react";
import { MistakeEntry } from "@shared/coreTypes";
import { CheckCircle2, RefreshCw, BookOpen, Loader2 } from "lucide-react";
import { markMastered, fetchExplanation } from "@/lib/mistakeService";
import { toast } from "sonner";

interface MistakeCardProps {
  mistake: MistakeEntry;
  grade: string;
  onMastered: (id: string) => void;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  Easy:   "bg-veda-mint/20 text-veda-mint border-veda-mint/30",
  Medium: "bg-veda-yellow/20 text-veda-yellow border-veda-yellow/30",
  Hard:   "bg-veda-coral/20 text-veda-coral border-veda-coral/30",
};

const SUBJECT_COLOR: Record<string, string> = {
  Math:    "text-veda-sky",
  Science: "text-veda-mint",
  English: "text-veda-lavender",
  Mixed:   "text-veda-coral",
};

export default function MistakeCard({ mistake, grade, onMastered }: MistakeCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState(mistake.explanation ?? "");
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [mastering, setMastering] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [retryAnswer, setRetryAnswer] = useState<string | null>(null);
  const [retryDone, setRetryDone] = useState(false);

  async function handleExplain() {
    if (explanation) { setShowExplanation((v) => !v); return; }
    setLoadingExplain(true);
    const text = await fetchExplanation(
      mistake.id,
      mistake.questionText,
      mistake.correctAnswer,
      mistake.userAnswer,
      mistake.topic,
      grade
    );
    setExplanation(text);
    setShowExplanation(true);
    setLoadingExplain(false);
  }

  async function handleMastered() {
    setMastering(true);
    await markMastered(mistake.id);
    toast.success(`"${mistake.topic}" marked as mastered! ✅`);
    onMastered(mistake.id);
  }

  function handleRetrySelect(label: string) {
    setRetryAnswer(label);
    setRetryDone(true);
  }

  const isRetryCorrect = retryAnswer === mistake.correctAnswer;

  return (
    <div
      className={[
        "rounded-2xl border bg-card shadow-soft transition-all duration-300",
        mistake.mastered ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="p-5 space-y-4">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold ${SUBJECT_COLOR[mistake.subject] ?? "text-foreground"}`}>
              {mistake.subject}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground">{mistake.topic}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_BADGE[mistake.difficulty]}`}>
              {mistake.difficulty}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {new Date(mistake.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* ── Question ── */}
        <p className="font-semibold text-sm leading-snug">{mistake.questionText}</p>

        {/* ── Answers ── */}
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-veda-coral/10 border border-veda-coral/25 px-3 py-2">
            <span className="text-[10px] font-bold text-veda-coral uppercase tracking-wide block mb-0.5">
              My Answer
            </span>
            <span>{mistake.userAnswer || "—"}</span>
          </div>
          <div className="rounded-xl bg-veda-mint/10 border border-veda-mint/25 px-3 py-2">
            <span className="text-[10px] font-bold text-veda-mint uppercase tracking-wide block mb-0.5">
              Correct Answer
            </span>
            <span>{mistake.correctAnswer || "—"}</span>
          </div>
        </div>

        {/* ── AI Explanation ── */}
        {showExplanation && explanation && (
          <div className="rounded-xl bg-veda-lavender/10 border border-veda-lavender/25 px-4 py-3 text-sm leading-relaxed">
            <p className="text-[10px] font-bold text-veda-lavender uppercase tracking-wide mb-1">
              AI Explanation
            </p>
            {explanation}
          </div>
        )}

        {/* ── Retry ── */}
        {showRetry && !retryDone && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Try again:</p>
            <p className="text-sm font-medium">{mistake.questionText}</p>
            <div className="grid gap-2">
              {/* Simulate options from correct + wrong answer */}
              {[mistake.correctAnswer, mistake.userAnswer]
                .filter(Boolean)
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .sort(() => Math.random() - 0.5)
                .map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleRetrySelect(opt)}
                    className="rounded-xl border px-3 py-2 text-sm text-left hover:bg-muted transition-all"
                  >
                    {opt}
                  </button>
                ))}
            </div>
          </div>
        )}

        {retryDone && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              isRetryCorrect
                ? "bg-veda-mint/10 border-veda-mint/30 text-veda-mint"
                : "bg-veda-coral/10 border-veda-coral/30 text-veda-coral"
            }`}
          >
            {isRetryCorrect ? "✅ Correct! You've got it now." : "❌ Still tricky — try viewing the explanation."}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => { setShowRetry((v) => !v); setRetryDone(false); setRetryAnswer(null); }}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-all"
          >
            <RefreshCw size={12} /> Retry
          </button>
          <button
            onClick={handleExplain}
            disabled={loadingExplain}
            className="flex items-center gap-1.5 rounded-xl border border-veda-lavender/40 bg-veda-lavender/10 text-veda-lavender px-3 py-1.5 text-xs font-semibold hover:bg-veda-lavender/20 transition-all disabled:opacity-50"
          >
            {loadingExplain ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
            {showExplanation ? "Hide" : "Explain"}
          </button>
          {!mistake.mastered && (
            <button
              onClick={handleMastered}
              disabled={mastering}
              className="flex items-center gap-1.5 rounded-xl border border-veda-mint/40 bg-veda-mint/10 text-veda-mint px-3 py-1.5 text-xs font-semibold hover:bg-veda-mint/20 transition-all disabled:opacity-50 ml-auto"
            >
              {mastering ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Mark Mastered
            </button>
          )}
          {mistake.mastered && (
            <span className="ml-auto flex items-center gap-1 text-xs text-veda-mint font-semibold">
              <CheckCircle2 size={12} /> Mastered
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
