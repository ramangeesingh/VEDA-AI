import { RequestHandler } from "express";
import {
  GenerateQuestionRequest,
  GenerateQuestionResponse,
  ExplainRequest,
  ExplainResponse,
  Difficulty,
  Subject,
} from "@shared/coreTypes";

// ─── Shared Gemini caller ────────────────────────────────────────────────────

async function callGemini(prompt: string, maxTokens = 2000): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-2.5-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
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

// ─── Question Parser ─────────────────────────────────────────────────────────

function parseQuestions(raw: string, count: number, grade: string, subject: Subject, difficulty: Difficulty): any[] {
  const questions: any[] = [];
  const lines = raw.split("\n");
  let currentQ: string | null = null;
  let options: string[] = [];
  let correctAnswer = "";
  let topic = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^Q\d*[:.]/.test(line)) {
      if (currentQ && options.length >= 2) {
        questions.push(buildQuestion(questions.length, currentQ, options, correctAnswer, topic, grade, subject, difficulty));
      }
      currentQ = line.replace(/^Q\d*[:.]?\s*/, "");
      options = [];
      correctAnswer = "";
      topic = "";
    } else if (/^[A-D][).]/.test(line)) {
      options.push(line.substring(2).trim());
    } else if (/^(Answer|Correct)[:.]?\s*/i.test(line)) {
      correctAnswer = line.replace(/^(Answer|Correct)[:.]?\s*/i, "").trim().charAt(0);
    } else if (/^Topic[:.]?\s*/i.test(line)) {
      topic = line.replace(/^Topic[:.]?\s*/i, "").trim();
    }
  }

  if (currentQ && options.length >= 2) {
    questions.push(buildQuestion(questions.length, currentQ, options, correctAnswer, topic, grade, subject, difficulty));
  }

  return questions.slice(0, count);
}

function buildQuestion(
  idx: number,
  text: string,
  opts: string[],
  correct: string,
  topic: string,
  grade: string,
  subject: Subject,
  difficulty: Difficulty
) {
  return {
    id: `gen-${idx}-${Date.now()}`,
    text,
    topic: topic || "General",
    grade,
    subject,
    difficulty,
    options: opts.map((label, i) => ({
      id: `${idx}-${i}`,
      label,
      correct: String.fromCharCode(65 + i) === correct.toUpperCase(),
    })),
  };
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export const handleGenerateQuestion: RequestHandler = async (req, res) => {
  try {
    const {
      grade,
      subject,
      difficulty,
      avoidTopics = [],
      count = 1,
    }: GenerateQuestionRequest = req.body;

    const avoid =
      avoidTopics.length > 0
        ? `Avoid these already-covered topics: ${avoidTopics.join(", ")}.`
        : "";

    const difficultyMap: Record<Difficulty, string> = {
      Easy: "simple, foundational level",
      Medium: "intermediate, requires some reasoning",
      Hard: "challenging, requires multi-step thinking",
    };

    const prompt = `Create ${count} multiple-choice question(s) for Class ${grade} ${subject} at ${difficultyMap[difficulty]} difficulty. ${avoid}

Each question must use this exact format (no extra text, no markdown):
Q1: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
Answer: [A/B/C/D]
Topic: [specific topic name]

Output ${count} question(s) using the exact format above:`;

    const raw = await callGemini(prompt, 1500);
    const questions = parseQuestions(raw, count, grade, subject, difficulty);

    if (questions.length === 0) {
      const result: GenerateQuestionResponse = {
        questions: [],
        success: false,
        error: "Could not parse questions from Gemini response",
      };
      return res.status(422).json(result);
    }

    const result: GenerateQuestionResponse = { questions, success: true };
    res.json(result);
  } catch (err: any) {
    const result: GenerateQuestionResponse = {
      questions: [],
      success: false,
      error: err.message,
    };
    res.status(500).json(result);
  }
};

export const handleExplain: RequestHandler = async (req, res) => {
  try {
    const { questionText, correctAnswer, userAnswer, topic, grade }: ExplainRequest = req.body;

    const prompt = `You are a friendly tutor for Class ${grade} students.

A student answered this question incorrectly:
Question: "${questionText}"
Topic: ${topic}
Student's answer: "${userAnswer}"
Correct answer: "${correctAnswer}"

Explain in 2-3 simple sentences:
1. Why the correct answer is right.
2. One tip to remember this concept.

Keep it encouraging and age-appropriate for Class ${grade}. No markdown formatting.`;

    const explanation = await callGemini(prompt, 400);
    const result: ExplainResponse = {
      explanation: explanation.trim() || "This concept requires practice. Focus on the fundamentals and try again!",
      success: true,
    };
    res.json(result);
  } catch (err: any) {
    const result: ExplainResponse = {
      explanation: "Unable to generate explanation right now. Please try again.",
      success: false,
      error: err.message,
    };
    res.status(500).json(result);
  }
};
