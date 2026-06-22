import { useState } from "react";
import { Question } from "@shared/coreTypes";
import { Lightbulb } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  selectedOptionId: string | null;
  onSelect: (id: string) => void;
  onHint: () => void;
  hintUsed: boolean;
  disabled?: boolean;
}

export default function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
  onHint,
  hintUsed,
  disabled = false,
}: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false);

  // Hint: eliminate one wrong option
  const hintOptionId = question.options.find((o) => !o.correct)?.id;

  function handleHint() {
    setShowHint(true);
    onHint();
  }

  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 shadow-soft space-y-5">
      {/* Topic pill */}
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-veda-lavender/15 border border-veda-lavender/25 px-3 py-0.5 text-[11px] font-semibold text-veda-lavender">
          {question.topic}
        </span>
        {!hintUsed && (
          <button
            onClick={handleHint}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-veda-yellow transition-colors"
          >
            <Lightbulb size={12} />
            Hint
          </button>
        )}
        {hintUsed && (
          <span className="text-[11px] text-veda-yellow flex items-center gap-1">
            <Lightbulb size={12} />
            Hint used
          </span>
        )}
      </div>

      {/* Question */}
      <h2 className="text-lg font-bold leading-snug">{question.text}</h2>

      {/* Options */}
      <div className="grid gap-3">
        {question.options.map((opt, i) => {
          const isSelected = selectedOptionId === opt.id;
          const isHinted = showHint && opt.id === hintOptionId;

          return (
            <button
              key={opt.id}
              onClick={() => !disabled && !isHinted && onSelect(opt.id)}
              disabled={disabled || isHinted}
              className={[
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                isHinted
                  ? "opacity-30 cursor-not-allowed border-border bg-muted"
                  : isSelected
                  ? "bg-veda-sky/15 border-veda-sky/60 shadow-soft scale-[1.01]"
                  : "bg-card hover:bg-veda-sky/5 hover:border-veda-sky/30 hover:-translate-y-0.5 border-border",
              ].join(" ")}
            >
              <span
                className={[
                  "flex-shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                  isSelected
                    ? "bg-veda-sky border-veda-sky text-white"
                    : "border-border text-muted-foreground",
                ].join(" ")}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className={isHinted ? "line-through" : ""}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
