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
  startAssessment,
  submitResponse,
  completeAssessment,
  buildReport,
} from "@/lib/assessmentService";
import {
  updateStudentProfile,
  applyReportToMastery,
  getOrCreateStudentProfile,
} from "@/lib/masteryService";
import { saveMistakesFromAssessment } from "@/lib/mistakeService";
import { generateQuestions } from "@/lib/practiceService";
import {
  Subject,
  Question,
  AssessmentReport,
  StudentProfile,
} from "@shared/coreTypes";
import { Brain, BookOpen, FlaskConical, Globe } from "lucide-react";
import { toast } from "sonner";

const SUBJECTS: { value: Subject; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "Math",    label: "Mathematics", icon: <Brain size={20} />,        color: "border-veda-sky/50 bg-veda-sky/10 hover:bg-veda-sky/20" },
  { value: "Science", label: "Science",     icon: <FlaskConical size={20} />, color: "border-veda-mint/50 bg-veda-mint/10 hover:bg-veda-mint/20" },
  { value: "English", label: "English",     icon: <BookOpen size={20} />,     color: "border-veda-lavender/50 bg-veda-lavender/10 hover:bg-veda-lavender/20" },
  { value: "Mixed",   label: "Mixed",       icon: <Globe size={20} />,        color: "border-veda-coral/50 bg-veda-coral/10 hover:bg-veda-coral/20" },
];

const MAX_QUESTIONS = 15;

export default function Assessment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill subject from query param if coming from recommendation
  const preSubject = (searchParams.get("subject") as Subject) || null;

  const {
    phase, session, currentQuestion, selectedOptionId,
    hintUsed, isCorrect, responseTimeMs,
    startSession, setQuestion, selectOption, submitAnswer,
    useHint, nextQuestion, setPhase,
  } = useAssessment();

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(preSubject);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [report, setReport]   = useState<AssessmentReport | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [correctSoFar, setCorrectSoFar] = useState(0);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState("");
  const [seenTopics, setSeenTopics] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch student profile on mount
  useEffect(() => {
    if (user) getOrCreateStudentProfile(user).then(setProfile);
  }, [user]);

  // Require auth
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // ── Load next question ───────────────────────────────────────────
  const loadNextQuestion = useCallback(async () => {
    if (!session) return;
    if (session.questionIndex >= MAX_QUESTIONS) {
      await finishAssessment();
      return;
    }
    setPhase("loading");
    try {
      const qs = await generateQuestions(
        session.grade,
        session.subject,
        session.currentDifficulty,
        1
      );
      if (qs.length > 0) {
        const q = qs[0] as Question;
        setSeenTopics((prev) => [...prev, q.topic]);
        setQuestion(q);
      } else {
        toast.error("Could not load question. Please try again.");
        setPhase("question");
      }
    } catch {
      toast.error("Network error loading question.");
      setPhase("setup");
    }
  }, [session, setPhase, setQuestion]);

  // Auto-load first question after session starts
  useEffect(() => {
    if (phase === "loading" && session && !currentQuestion) {
      loadNextQuestion();
    }
  }, [phase, session, currentQuestion, loadNextQuestion]);

  // ── Start Assessment ─────────────────────────────────────────────
  async function handleStart() {
    if (!user || !selectedSubject) return;
    const grade = profile?.grade || "6";
    const id = await startAssessment(user.id, grade, selectedSubject);
    if (!id) { toast.error("Could not start assessment. Try again."); return; }
    setAssessmentId(id);
    startSession(id, grade, selectedSubject);
  }

  // ── Submit Answer ────────────────────────────────────────────────
  async function handleSubmit() {
    if (!session || !currentQuestion || !assessmentId || !user) return;
    const record = submitAnswer();
    if (!record) return;

    const correctOpt = currentQuestion.options.find((o) => o.correct);
    setLastCorrectAnswer(correctOpt?.label ?? "");

    if (record.isCorrect) setCorrectSoFar((n) => n + 1);

    // Persist response
    await submitResponse(assessmentId, user.id, {
      questionText: currentQuestion.text,
      topic:        currentQuestion.topic,
      subject:      currentQuestion.subject,
      difficulty:   session.currentDifficulty,
      userAnswer:   currentQuestion.options.find((o) => o.id === selectedOptionId)?.label ?? "",
      correctAnswer: correctOpt?.label ?? "",
      isCorrect:    record.isCorrect,
      responseTimeMs: record.responseTimeMs,
      hintUsed,
    });
  }

  // ── Finish Assessment ────────────────────────────────────────────
  async function finishAssessment() {
    if (!session || !assessmentId || !user) return;
    setIsSaving(true);
    setPhase("complete" as any);

    const prevProfile = profile
      ? { retention: profile.retention, application: profile.application, grasping: profile.grasping, speed: profile.speed }
      : { retention: 0, application: 0, grasping: 0, speed: 0 };

    const builtReport = buildReport(assessmentId, session, prevProfile);
    setReport(builtReport);

    // Save to Supabase in parallel
    await Promise.all([
      completeAssessment(assessmentId, builtReport),
      applyReportToMastery(user.id, builtReport),
      updateStudentProfile(user.id, {
        ...builtReport.updatedProfile,
        xp: (profile?.xp ?? 0) + builtReport.xpEarned,
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
    toast.success(`+${builtReport.xpEarned} XP earned! Great work! 🎉`);
  }

  // ── Handle Next Question / Finish ────────────────────────────────
  async function handleNext() {
    if (!session) return;
    const nextIdx = session.questionIndex;
    if (nextIdx >= MAX_QUESTIONS) {
      await finishAssessment();
    } else {
      nextQuestion();
      await loadNextQuestion();
    }
  }

  // ── Retake ───────────────────────────────────────────────────────
  function handleRetake() {
    setReport(null);
    setAssessmentId(null);
    setCorrectSoFar(0);
    setSeenTopics([]);
    setSelectedSubject(preSubject);
    setPhase("setup" as any);
  }

  // ─────────────────────────────────────────────────────────────────
  if (authLoading) return null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Setup: Subject Selection ── */}
        {(phase === "setup" || !session) && !report && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-extrabold">Adaptive Assessment</h1>
              <p className="text-muted-foreground text-sm">
                Questions adapt in real-time to your performance
              </p>
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {["15 Questions", "Adjusts to your level", "Saves to your profile", "Tracks weak topics"].map((t) => (
                <span key={t} className="rounded-full bg-muted border px-3 py-1 font-medium">
                  {t}
                </span>
              ))}
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Choose a subject:</p>
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSubject(s.value)}
                    className={[
                      "rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft active:scale-95",
                      s.color,
                      selectedSubject === s.value
                        ? "ring-2 ring-veda-sky shadow-soft"
                        : "",
                    ].join(" ")}
                  >
                    <div className="mb-1.5">{s.icon}</div>
                    <div className="font-bold text-sm">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {profile?.grade && (
              <p className="text-xs text-muted-foreground text-center">
                Grade <span className="font-bold">{profile.grade}</span> questions will be generated
              </p>
            )}

            <button
              onClick={handleStart}
              disabled={!selectedSubject}
              className="w-full rounded-2xl bg-gradient-to-r from-veda-sky to-veda-lavender text-white py-3.5 font-bold shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Assessment 🚀
            </button>
          </div>
        )}

        {/* ── Loading question ── */}
        {phase === "loading" && session && !report && (
          <div className="rounded-2xl border bg-card p-12 text-center shadow-soft">
            <div className="w-10 h-10 rounded-full border-2 border-veda-sky border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Generating your next question…</p>
          </div>
        )}

        {/* ── Active Question ── */}
        {phase === "question" && session && currentQuestion && !report && (
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
        {phase === "feedback" && session && isCorrect !== null && !report && (
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

        {/* ── Saving ── */}
        {isSaving && !report && (
          <div className="rounded-2xl border bg-card p-12 text-center shadow-soft">
            <div className="w-10 h-10 rounded-full border-2 border-veda-lavender border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Saving your results…</p>
          </div>
        )}

        {/* ── Report ── */}
        {report && !isSaving && (
          <AssessmentReportCard report={report} onRetake={handleRetake} />
        )}
      </div>
    </MainLayout>
  );
}
