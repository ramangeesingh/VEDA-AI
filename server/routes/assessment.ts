/**
 * Assessment Server Routes
 *
 * POST /api/assessment/start    — generate all 15 questions + create assessment row
 * POST /api/assessment/question — single question (backward compat / practice page)
 * POST /api/assessment/respond  — save one student response
 * POST /api/explain             — AI explanation for a wrong answer
 */

import { RequestHandler } from "express";
import {
  StartAssessmentRequest,
  StartAssessmentResponse,
  GenerateQuestionRequest,
  GenerateQuestionResponse,
  SaveResponseRequest,
  ExplainRequest,
  ExplainResponse,
  Difficulty,
  Subject,
  Question,
  QuestionOption,
} from "@shared/coreTypes";

// ─── Gemini JSON caller ───────────────────────────────────────────────────────

async function callGeminiJSON<T>(prompt: string, schema: object): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.7,
      maxOutputTokens: 8000,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini API ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.text ||
    "{}";

  return JSON.parse(text) as T;
}

// Plain text Gemini call (for explanations)
async function callGeminiText(prompt: string, maxTokens = 500): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.6 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini API ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.text ||
    ""
  );
}

// ─── JSON Schema for Gemini ───────────────────────────────────────────────────

const QUESTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4,
          },
          correctAnswer: { type: "string" },
          explanation: { type: "string" },
          topic: { type: "string" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
        },
        required: ["question", "options", "correctAnswer", "explanation", "topic", "difficulty"],
      },
    },
  },
  required: ["questions"],
};

interface GeminiQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

interface GeminiQuestionBatch {
  questions: GeminiQuestion[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapToQuestion(
  gq: GeminiQuestion,
  idx: number,
  grade: string,
  subject: Subject
): Question {
  const diff = (["Easy", "Medium", "Hard"].includes(gq.difficulty)
    ? gq.difficulty
    : "Easy") as Difficulty;

  // Build options array — deduplicate correctAnswer first to ensure it's included
  const rawOpts = gq.options.slice(0, 4);
  const hasCorrect = rawOpts.some(
    (o) => o.trim().toLowerCase() === gq.correctAnswer.trim().toLowerCase()
  );
  const opts = hasCorrect ? rawOpts : [gq.correctAnswer, ...rawOpts.slice(0, 3)];

  const options: QuestionOption[] = opts.map((label, i) => ({
    id: `q${idx}-opt${i}`,
    label: label.trim(),
    correct: label.trim().toLowerCase() === gq.correctAnswer.trim().toLowerCase(),
  }));

  return {
    id: `gen-${idx}-${Date.now()}`,
    grade,
    subject,
    topic: gq.topic || "General",
    difficulty: diff,
    text: gq.question,
    options,
    explanation: gq.explanation,
  };
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  Easy: "simple, foundational — suitable for beginners",
  Medium: "intermediate — requires reasoning and concept understanding",
  Hard: "challenging — multi-step thinking, application of knowledge",
};

// ─── Generate questions for a single difficulty ────────────────────────────────

async function generateForDifficulty(
  grade: string,
  subject: Subject,
  difficulty: Difficulty,
  count: number,
  avoidTopics: string[] = []
): Promise<GeminiQuestion[]> {
  const avoid =
    avoidTopics.length > 0
      ? `\nAvoid topics already covered: ${avoidTopics.join(", ")}.`
      : "";

  const subjectHint =
    subject === "Mixed"
      ? "covering a mix of Mathematics, Science, and English Language"
      : `about ${subject}`;

  const prompt = `You are an expert educational content creator for Indian school students.

Generate exactly ${count} multiple-choice questions ${subjectHint} for Class ${grade} students.
Difficulty: ${difficulty} (${DIFFICULTY_LABELS[difficulty]}).${avoid}

Requirements:
- Each question must have exactly 4 answer options
- The correctAnswer field must EXACTLY match one of the 4 options (copy-paste the same string)
- Provide a clear, encouraging explanation (2-3 sentences) for why the answer is correct
- Topic should be a specific concept name (e.g., "Photosynthesis", "Fractions", "Tenses")
- Questions must be educational, age-appropriate, and engaging

Return exactly ${count} questions.`;

  const result = await callGeminiJSON<GeminiQuestionBatch>(prompt, QUESTION_JSON_SCHEMA);
  return result.questions?.slice(0, count) || [];
}

// ─── Supabase client (server-side) ────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

/**
 * POST /api/assessment/start
 * Generate all questions upfront, create assessment row, save questions to DB
 */
export const handleStartAssessment: RequestHandler = async (req, res) => {
  try {
    const {
      userId,
      grade,
      subject,
      totalQuestions = 15,
    }: StartAssessmentRequest = req.body;

    if (!userId || !grade || !subject) {
      return res.status(400).json({
        success: false,
        error: "userId, grade, and subject are required",
      } satisfies StartAssessmentResponse);
    }

    // Distribution: 6 Easy, 6 Medium, 3 Hard (adaptive engine picks from pool)
    const easyCount = Math.ceil(totalQuestions * 0.4);   // 6
    const mediumCount = Math.ceil(totalQuestions * 0.4); // 6
    const hardCount = totalQuestions - easyCount - mediumCount; // 3

    // Generate all three difficulty batches in parallel
    const [easyRaw, mediumRaw, hardRaw] = await Promise.all([
      generateForDifficulty(grade, subject as Subject, "Easy", easyCount),
      generateForDifficulty(grade, subject as Subject, "Medium", mediumCount),
      generateForDifficulty(grade, subject as Subject, "Hard", hardCount),
    ]);

    // Map to Question format, tag with difficulty
    let idx = 0;
    const allQuestions: Question[] = [
      ...easyRaw.map((q) => mapToQuestion(q, idx++, grade, subject as Subject)),
      ...mediumRaw.map((q) => mapToQuestion(q, idx++, grade, subject as Subject)),
      ...hardRaw.map((q) => mapToQuestion(q, idx++, grade, subject as Subject)),
    ];

    if (allQuestions.length === 0) {
      return res.status(422).json({
        success: false,
        error: "Gemini returned no questions. Please try again.",
        assessmentId: "",
        questions: [],
      } satisfies StartAssessmentResponse);
    }

    // Create assessment row in Supabase
    const supabase = getSupabase();
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({
        user_id: userId,
        grade,
        subject,
        status: "in_progress",
        total_questions: 0,
        correct_answers: 0,
        overall_score: 0,
        difficulty_progression: [],
      })
      .select("id")
      .single();

    if (assessmentError || !assessment) {
      console.error("Assessment insert error:", assessmentError);
      // Return questions even if DB insert fails — client can still run assessment
      return res.json({
        success: true,
        assessmentId: `local-${Date.now()}`,
        questions: allQuestions,
      } satisfies StartAssessmentResponse);
    }

    const assessmentId = assessment.id;

    // Save all questions to assessment_questions table
    const questionRows = allQuestions.map((q, i) => ({
      assessment_id: assessmentId,
      user_id: userId,
      question_index: i,
      question_text: q.text,
      options: q.options.map((o) => o.label),
      correct_answer: q.options.find((o) => o.correct)?.label ?? "",
      explanation: q.explanation,
      topic: q.topic,
      subject: q.subject,
      difficulty: q.difficulty,
    }));

    // Save question IDs back into questions for response linking
    const { data: savedQs } = await supabase
      .from("assessment_questions")
      .insert(questionRows)
      .select("id, question_index");

    // Attach DB ids back to the Question objects
    if (savedQs) {
      savedQs.forEach((sq: { id: string; question_index: number }) => {
        const q = allQuestions[sq.question_index];
        if (q) (q as any).dbId = sq.id;
      });
    }

    return res.json({
      success: true,
      assessmentId,
      questions: allQuestions,
    } satisfies StartAssessmentResponse);
  } catch (err: any) {
    console.error("handleStartAssessment error:", err);
    return res.status(500).json({
      success: false,
      assessmentId: "",
      questions: [],
      error: err.message,
    } satisfies StartAssessmentResponse);
  }
};

/**
 * POST /api/assessment/respond
 * Save a single student response to assessment_responses table
 */
export const handleSaveResponse: RequestHandler = async (req, res) => {
  try {
    const body: SaveResponseRequest = req.body;
    const supabase = getSupabase();

    const { error } = await supabase.from("assessment_responses").insert({
      assessment_id: body.assessmentId,
      user_id: body.userId,
      question_index: body.questionIndex,
      question_text: body.questionText,
      topic: body.topic,
      subject: body.subject,
      difficulty_at_time: body.difficultyAtTime,
      user_answer: body.userAnswer,
      correct_answer: body.correctAnswer,
      is_correct: body.isCorrect,
      response_time_ms: body.responseTimeMs,
      hint_used: body.hintUsed,
    });

    if (error) {
      console.error("Save response error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("handleSaveResponse error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/assessment/question
 * Single question generation (backward compat, used by practice page)
 */
export const handleGenerateQuestion: RequestHandler = async (req, res) => {
  try {
    const {
      grade,
      subject,
      difficulty,
      avoidTopics = [],
      count = 1,
    }: GenerateQuestionRequest = req.body;

    const raw = await generateForDifficulty(
      grade,
      subject as Subject,
      difficulty,
      count,
      avoidTopics
    );

    const questions = raw.map((q, i) =>
      mapToQuestion(q, i, grade, subject as Subject)
    );

    if (questions.length === 0) {
      return res.status(422).json({
        questions: [],
        success: false,
        error: "Could not generate question. Please try again.",
      } satisfies GenerateQuestionResponse);
    }

    return res.json({ questions, success: true } satisfies GenerateQuestionResponse);
  } catch (err: any) {
    console.error("handleGenerateQuestion error:", err);
    return res.status(500).json({
      questions: [],
      success: false,
      error: err.message,
    } satisfies GenerateQuestionResponse);
  }
};

/**
 * POST /api/explain
 * AI explanation for a wrong answer
 */
export const handleExplain: RequestHandler = async (req, res) => {
  try {
    const { questionText, correctAnswer, userAnswer, topic, grade }: ExplainRequest =
      req.body;

    const prompt = `You are a friendly, encouraging tutor for Class ${grade} students.

A student answered this ${topic} question incorrectly:
Question: "${questionText}"
Student's answer: "${userAnswer}"
Correct answer: "${correctAnswer}"

Write 2-3 short, encouraging sentences that:
1. Clearly explain why "${correctAnswer}" is correct
2. Give a simple memory tip or trick to remember this concept

Keep the tone warm, supportive, and age-appropriate. No markdown or bullet points.`;

    const explanation = await callGeminiText(prompt, 400);

    return res.json({
      explanation: explanation.trim() || "Great effort! Review this concept and you'll get it next time.",
      success: true,
    } satisfies ExplainResponse);
  } catch (err: any) {
    console.error("handleExplain error:", err);
    return res.status(500).json({
      explanation: "Unable to load explanation right now. Please try again.",
      success: false,
      error: err.message,
    } satisfies ExplainResponse);
  }
};
