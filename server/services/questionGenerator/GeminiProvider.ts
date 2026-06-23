import { AIProvider } from "./AIProvider";
import { QuestionRequest, VedaMCQ } from "./types";

export class GeminiProvider implements AIProvider {
  name = "gemini";

  async generateQuestions(req: QuestionRequest): Promise<VedaMCQ[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment");
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const subjectHint =
      req.subject === "Mixed"
        ? "covering a mix of Mathematics, Science, and English Language"
        : `about ${req.subject}`;

    const difficultyLabels = {
      Easy: "simple, foundational — suitable for beginners",
      Medium: "intermediate — requires reasoning and concept understanding",
      Hard: "challenging — multi-step thinking, application of knowledge",
    };

    const avoid =
      req.avoidQuestions && req.avoidQuestions.length > 0
        ? `\nAvoid repeating or reusing any of these existing questions: ${req.avoidQuestions.join(", ")}.`
        : "";

    const prompt = `You are an expert educational content creator for Indian school students.

Generate exactly ${req.count} multiple-choice questions ${subjectHint} for Class ${req.classLevel} students.
Difficulty: ${req.difficulty} (${difficultyLabels[req.difficulty]}).${avoid}

Requirements:
- Each question must have exactly 4 answer options
- The correctAnswer field must EXACTLY match one of the 4 options (copy-paste the same string)
- Provide a clear, encouraging explanation (2-3 sentences) for why the answer is correct
- Topic should be a specific concept name (e.g., "Photosynthesis", "Fractions", "Tenses")
- Questions must be educational, age-appropriate, and engaging

Return exactly ${req.count} questions.`;

    const schema = {
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
            },
            required: ["question", "options", "correctAnswer", "explanation", "topic"],
          },
        },
      },
      required: ["questions"],
    };

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
        maxOutputTokens: 8000,
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.candidates?.[0]?.text ||
      "{}";

    const parsed = JSON.parse(text);
    const questionsList: any[] = parsed.questions || [];

    return questionsList.map((q) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      topic: q.topic || "General",
      difficulty: req.difficulty,
      classLevel: req.classLevel,
    }));
  }
}
