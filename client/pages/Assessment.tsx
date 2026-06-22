import { useEffect, useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAssessment } from "@/hooks/useAssessment";
import AssessmentHeader from "@/components/veda/assessment/AssessmentHeader";
import QuestionCard from "@/components/veda/assessment/QuestionCard";
import ResultFeedback from "@/components/veda/assessment/ResultFeedback";
import AssessmentReportCard from "@/components/veda/assessment/AssessmentReport";
import {
  startAndLoadAssessment,
  saveAssessmentResponse,
  completeAssessment,
  buildReport,
} from "@/lib/assessmentService";
import {
  updateStudentProfile,
  applyReportToMastery,
  getOrCreateStudentProfile,
} from "@/lib/masteryService";
import { saveMistakesFromAssessment } from "@/lib/mistakeService";
import {
  Subject,
  Question,
  AssessmentReport,
  StudentProfile,
} from "@shared/coreTypes";
import { Brain, BookOpen, FlaskConical, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECTS: { value: Subject; label: string; icon: React.ReactNode; color: string; emoji: string }[] = [
  { value: "Math",    label: "Mathematics", icon: <Brain size={22} />,        color: "border-veda-sky/50 bg-veda-sky/10 hover:bg-veda-sky/20 hover:border-veda-sky/70",       emoji: "🔢" },
  { value: "Science", label: "Science",     icon: <FlaskConical size={22} />, color: "border-veda-mint/50 bg-veda-mint/10 hover:bg-veda-mint/20 hover:border-veda-mint/70",   emoji: "🔬" },
  { value: "English", label: "English",     icon: <BookOpen size={22} />,     color: "border-veda-lavender/50 bg-veda-lavender/10 hover:bg-veda-lavender/20 hover:border-veda-lavender/70", emoji: "📖" },
  { value: "Mixed",   label: "Mixed",       icon: <Globe size={22} />,        color: "border-veda-coral/50 bg-veda-coral/10 hover:bg-veda-coral/20 hover:border-veda-coral/70", emoji: "🌍" },
];

const MAX_QUESTIONS = 15;

// ─── Assessment Page ──────────────────────────────────────────────────────────

export default function Assessment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preSubject = (searchParams.get("subject") as Subject) || null;

  const {
    phase,
    session,
    currentQuestion,
    selectedOptionId,
    hintUsed,
    isCorrect,
    responseTimeMs,
    startSession,
    loadPool,
    loadNextFromPool,
    setQuestion,
    selectOption,
    submitAnswer,
    useHint,
    nextQuestion,
    setPhase,
    resetSession,
  } = useAssessment();

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(preSubject);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [report, setReport]   = useState<AssessmentReport | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [correctSoFar, setCorrectSoFar] = useState(0);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("Generating your questions…");

  // Load student profile
  useEffect(() => {
    if (user) getOrCreateStudentProfile(user).then(setProfile);
  }, [user]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // ── Advance loading message ────────────────────────────────────────────────
  useEffect(() => {
    if (!isGenerating) return;
    const messages = [
      "Generating your questions…",
      "Tailoring to your level…",
      "Building your adaptive test…",
      "Almost ready…",
    ];
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % messages.length;
      setGeneratingMessage(messages[i]);
    }, 1800);
    return () => clearInterval(timer);
  }, [isGenerating]);

  // ── Start Assessment (batch load all questions) ────────────────────────────
  async function handleStart() {
    if (!user || !selectedSubject) return;
    const grade = profile?.grade || "6";

    setIsGenerating(true);
    setGeneratingMessage("Generating your questions…");

    try {
      const result = await startAndLoadAssessment(user.id, grade, selectedSubject, MAX_QUESTIONS);

      if (!result) {
        toast.error("Could not generate questions. Please try again.");
        setIsGenerating(false);
        return;
      }

      const { assessmentId: id, questions } = result;
      setAssessmentId(id);
      loadPool(questions);
      startSession(id, grade, selectedSubject);

      // Load the first question from pool immediately after session starts
      // (slight delay for state to settle)
      setTimeout(() => {
        const first = questions.find((q) => q.difficulty === "Easy") ?? questions[0];
        if (first) setQuestion(first);
      }, 100);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Advance to next question from pool ─────────────────────────────────────
  const advanceToNextQuestion = useCallback(() => {
    const q = loadNextFromPool();
    if (q) {
      setQuestion(q);
    } else {
      toast.error("No more questions available.");
    }
  }, [loadNextFromPool, setQuestion]);

  // ── Submit Answer ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!session || !currentQuestion || !assessmentId || !user) return;

    const record = submitAnswer();
    if (!record) return;

    const correctOpt = currentQuestion.options.find((o) => o.correct);
    setLastCorrectAnswer(correctOpt?.label ?? "");
    if (record.isCorrect) setCorrectSoFar((n) => n + 1);

    // Save response to Supabase via server
    await saveAssessmentResponse({
      assessmentId,
      userId: user.id,
      questionIndex: session.questionIndex,
      questionText: currentQuestion.text,
      topic: currentQuestion.topic,
      subject: currentQuestion.subject,
      difficultyAtTime: session.currentDifficulty,
      userAnswer: currentQuestion.options.find((o) => o.id === selectedOptionId)?.label ?? "",
      correctAnswer: correctOpt?.label ?? "",
      isCorrect: record.isCorrect,
      responseTimeMs: record.responseTimeMs,
      hintUsed,
    });
  }

  // ── Finish Assessment ──────────────────────────────────────────────────────
  async function finishAssessment() {
    if (!session || !assessmentId || !user) return;
    setIsSaving(true);
    setPhase("complete" as any);

    const prevProfile = profile
      ? { retention: profile.retention, application: profile.application, grasping: profile.grasping, speed: profile.speed }
      : { retention: 0, application: 0, grasping: 0, speed: 0 };

    const builtReport = buildReport(assessmentId, session, prevProfile);
    setReport(builtReport);

    const newXp = (profile?.xp ?? 0) + builtReport.xpEarned;
    const newLevel = Math.max(1, Math.floor(newXp / 150) + 1);

    await Promise.all([
      completeAssessment(assessmentId, builtReport),
      applyReportToMastery(user.id, builtReport),
      updateStudentProfile(user.id, {
        ...builtReport.updatedProfile,
        xp: newXp,
        lastActive: new Date().toISOString().split("T")[0],
      }),
      saveMistakesFromAssessment(
        user.id,
        assessmentId,
        session.answers
          .filter((a) => !a.isCorrect)
          .map((a) => ({
            questionText:  a.question,
            userAnswer:    a.userAnswer,
            correctAnswer: a.correctAnswer,
            topic:         a.topic,
            subject:       a.subject,
            difficulty:    a.difficulty,
          }))
      ),
    ]);

    setIsSaving(false);
    toast.success(`+${builtReport.xpEarned} XP earned! Level ${newLevel} 🎉`);
  }

  // ── Handle Next Question or Finish ────────────────────────────────────────
  async function handleNext() {
    if (!session) return;
    const nextIdx = session.questionIndex; // already incremented by submitAnswer
    if (nextIdx >= MAX_QUESTIONS) {
      await finishAssessment();
    } else {
      nextQuestion();
      advanceToNextQuestion();
    }
  }

  // ── Retake ─────────────────────────────────────────────────────────────────
  function handleRetake() {
    setReport(null);
    setAssessmentId(null);
    setCorrectSoFar(0);
    setSelectedSubject(preSubject);
    resetSession();
  }

  if (authLoading) return null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Generating overlay ── */}
        {isGenerating && (
          <div className="rounded-3xl border bg-card/80 backdrop-blur-sm p-12 text-center shadow-soft-lg space-y-6">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-veda-sky/20" />
              <div className="absolute inset-0 rounded-full border-4 border-veda-sky border-t-transparent animate-spin" />
              <Brain size={24} className="absolute inset-0 m-auto text-veda-sky" />
            </div>
            <div>
              <p className="font-bold text-lg">{generatingMessage}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Gemini AI is crafting {MAX_QUESTIONS} adaptive questions for you
              </p>
            </div>
            <div className="flex justify-center gap-1.5">
              {["Easy", "Medium", "Hard"].map((d, i) => (
                <span
                  key={d}
                  className="rounded-full px-3 py-1 text-xs font-semibold bg-muted border animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Setup: Subject Selection ── */}
        {!isGenerating && (phase === "setup" || !session) && !report && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-extrabold">Adaptive Assessment</h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Powered by Gemini AI — questions adapt in real-time based on your speed and accuracy
              </p>
            </div>

            {/* Feature chips */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {[
                "✨ AI-Generated Questions",
                "📊 15 Adaptive Questions",
                "⚡ Difficulty Adjusts Live",
                "💾 Saves to Your Profile",
                "🎯 Tracks Weak Topics",
              ].map((t) => (
                <span key={t} className="rounded-full bg-muted border px-3 py-1 font-medium">
                  {t}
                </span>
              ))}
            </div>

            {/* Subject grid */}
            <div>
              <p className="text-sm font-semibold mb-3">Choose a subject:</p>
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSubject(s.value)}
                    className={[
                      "rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft active:scale-95",
                      s.color,
                      selectedSubject === s.value
                        ? "ring-2 ring-veda-sky shadow-soft scale-[1.01]"
                        : "",
                    ].join(" ")}
                  >
                    <div className="text-2xl mb-2">{s.emoji}</div>
                    <div className="font-bold text-sm">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      {s.icon} AI-powered
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {profile?.grade && (
              <p className="text-xs text-muted-foreground text-center">
                Class <span className="font-bold">{profile.grade}</span> questions will be generated for you
              </p>
            )}

            <button
              onClick={handleStart}
              disabled={!selectedSubject}
              className="w-full rounded-2xl bg-gradient-to-r from-veda-sky to-veda-lavender text-white py-4 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Brain size={18} />
              Start Adaptive Assessment 🚀
            </button>
          </div>
        )}

        {/* ── Loading next question from pool ── */}
        {!isGenerating && phase === "loading" && session && !report && (
          <div className="rounded-2xl border bg-card p-12 text-center shadow-soft">
            <Loader2 size={32} className="text-veda-sky animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Selecting next question…</p>
          </div>
        )}

        {/* ── Active Question ── */}
        {!isGenerating && phase === "question" && session && currentQuestion && !report && (
          <div className="space-y-4">
            <AssessmentHeader
              questionIndex={session.questionIndex}
              totalQuestions={MAX_QUESTIONS}
              difficulty={session.currentDifficulty}
              subject={session.subject}
              correctSoFar={correctSoFar}
            />
            <QuestionCard
              question={currentQuestion}
              selectedOptionId={selectedOptionId}
              onSelect={selectOption}
              onHint={useHint}
              hintUsed={hintUsed}
              disabled={false}
            />
            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId}
              className="w-full rounded-2xl bg-veda-coral text-white py-3.5 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          </div>
        )}

        {/* ── Feedback ── */}
        {!isGenerating && phase === "feedback" && session && isCorrect !== null && !report && (
          <div className="space-y-4">
            <AssessmentHeader
              questionIndex={session.questionIndex}
              totalQuestions={MAX_QUESTIONS}
              difficulty={session.currentDifficulty}
              subject={session.subject}
              correctSoFar={correctSoFar}
            />
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                selectedOptionId={selectedOptionId}
                onSelect={() => {}}
                onHint={() => {}}
                hintUsed={hintUsed}
                disabled
              />
            )}
            <ResultFeedback
              isCorrect={isCorrect}
              correctLabel={lastCorrectAnswer}
              xpEarned={isCorrect ? 12 : 2}
              responseTimeMs={responseTimeMs}
              onNext={handleNext}
              isLast={session.questionIndex >= MAX_QUESTIONS}
            />
          </div>
        )}

        {/* ── Saving results ── */}
        {isSaving && !report && (
          <div className="rounded-2xl border bg-card p-12 text-center shadow-soft space-y-4">
            <div className="relative mx-auto w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-veda-lavender/20" />
              <div className="absolute inset-0 rounded-full border-4 border-veda-lavender border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="font-bold">Saving your results…</p>
              <p className="text-sm text-muted-foreground mt-1">
                Updating your learning profile and mastery scores
              </p>
            </div>
          </div>
        )}

        {/* ── Report Card ── */}
        {report && !isSaving && (
          <AssessmentReportCard report={report} onRetake={handleRetake} />
        )}
      </div>
    </MainLayout>
  );
}
