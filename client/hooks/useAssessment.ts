/**
 * useAssessment — Stateful assessment session controller.
 *
 * New architecture:
 * - All questions are pre-loaded upfront from /api/assessment/start
 * - The hook manages the question pool and adaptive difficulty selection
 * - selectNextQuestion() picks from the pool based on current difficulty
 */

import { useState, useRef, useCallback } from "react";
import {
  AssessmentSession,
  AnswerRecord,
  Difficulty,
  Subject,
  Question,
} from "@shared/coreTypes";
import {
  computeNextDifficulty,
  selectNextQuestion,
} from "@/lib/assessmentService";

const MAX_QUESTIONS = 15;

type Phase = "setup" | "loading" | "question" | "feedback" | "complete";

export interface UseAssessmentReturn {
  phase: Phase;
  session: AssessmentSession | null;
  currentQuestion: Question | null;
  questionPool: Question[];
  usedQuestionIds: Set<string>;
  selectedOptionId: string | null;
  hintUsed: boolean;
  isCorrect: boolean | null;
  responseTimeMs: number;
  questionStartTime: number;
  // Actions
  startSession: (assessmentId: string, grade: string, subject: Subject) => void;
  loadPool: (questions: Question[]) => void;
  loadNextFromPool: () => Question | null;
  setQuestion: (q: Question) => void;
  selectOption: (optionId: string) => void;
  submitAnswer: () => AnswerRecord | null;
  useHint: () => void;
  nextQuestion: () => void;
  setPhase: (p: Phase) => void;
  resetSession: () => void;
}

export function useAssessment(): UseAssessmentReturn {
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState(0);
  const questionStartRef = useRef<number>(Date.now());

  const startSession = useCallback(
    (assessmentId: string, grade: string, subject: Subject) => {
      setSession({
        assessmentId,
        grade,
        subject,
        currentDifficulty: "Easy",
        questionIndex: 0,
        totalQuestions: MAX_QUESTIONS,
        answers: [],
        startedAt: Date.now(),
      });
      setUsedQuestionIds(new Set());
      setPhase("loading");
    },
    []
  );

  const loadPool = useCallback((questions: Question[]) => {
    setQuestionPool(questions);
  }, []);

  /**
   * Pick the next question from the pool based on current session difficulty.
   * Marks the question as used so it won't be shown again.
   */
  const loadNextFromPool = useCallback((): Question | null => {
    if (!session) return null;

    const q = selectNextQuestion(
      questionPool,
      usedQuestionIds,
      session.currentDifficulty
    );

    if (q) {
      setUsedQuestionIds((prev) => new Set([...prev, q.id]));
    }
    return q;
  }, [session, questionPool, usedQuestionIds]);

  const setQuestion = useCallback((q: Question) => {
    setCurrentQuestion(q);
    setSelectedOptionId(null);
    setHintUsed(false);
    setIsCorrect(null);
    setResponseTimeMs(0);
    questionStartRef.current = Date.now();
    setPhase("question");
  }, []);

  const selectOption = useCallback((optionId: string) => {
    setSelectedOptionId(optionId);
  }, []);

  const useHint = useCallback(() => {
    setHintUsed(true);
  }, []);

  const submitAnswer = useCallback((): AnswerRecord | null => {
    if (!session || !currentQuestion || !selectedOptionId) return null;

    const elapsed = Date.now() - questionStartRef.current;
    const chosenOption = currentQuestion.options.find((o) => o.id === selectedOptionId);
    const correctOption = currentQuestion.options.find((o) => o.correct);
    const correct = chosenOption?.correct ?? false;

    setIsCorrect(correct);
    setResponseTimeMs(elapsed);

    const nextDiff = computeNextDifficulty(
      session.currentDifficulty,
      correct,
      elapsed
    );

    const record: AnswerRecord = {
      question: currentQuestion.text,
      topic: currentQuestion.topic,
      subject: currentQuestion.subject,
      difficulty: session.currentDifficulty,
      isCorrect: correct,
      responseTimeMs: elapsed,
      hintUsed,
      userAnswer: chosenOption?.label ?? "",
      correctAnswer: correctOption?.label ?? "",
    };

    setSession((prev) =>
      prev
        ? {
            ...prev,
            currentDifficulty: nextDiff,
            questionIndex: prev.questionIndex + 1,
            answers: [...prev.answers, record],
          }
        : prev
    );

    setPhase("feedback");
    return record;
  }, [session, currentQuestion, selectedOptionId, hintUsed]);

  const nextQuestion = useCallback(() => {
    setPhase("loading");
    setCurrentQuestion(null);
    setSelectedOptionId(null);
  }, []);

  const resetSession = useCallback(() => {
    setPhase("setup");
    setSession(null);
    setCurrentQuestion(null);
    setQuestionPool([]);
    setUsedQuestionIds(new Set());
    setSelectedOptionId(null);
    setHintUsed(false);
    setIsCorrect(null);
    setResponseTimeMs(0);
  }, []);

  return {
    phase,
    session,
    currentQuestion,
    questionPool,
    usedQuestionIds,
    selectedOptionId,
    hintUsed,
    isCorrect,
    responseTimeMs,
    questionStartTime: questionStartRef.current,
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
  };
}
