import { AIProvider } from "./AIProvider";
import { QuestionRequest, VedaMCQ } from "./types";

export class GroqProvider implements AIProvider {
  name = "groq";

  async generateQuestions(req: QuestionRequest): Promise<VedaMCQ[]> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not defined in environment");
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

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

You must return a JSON object with a single root key "questions", which is an array of objects.
Each object must have these exact properties:
- "question": string
- "options": array of exactly 4 strings
- "correctAnswer": string
- "explanation": string
- "topic": string

JSON structure example:
{
  "questions": [
    {
      "question": "What is 1/2 + 1/4?",
      "options": ["1/6", "2/6", "3/4", "1/8"],
      "correctAnswer": "3/4",
      "explanation": "To add fractions, find a common denominator: 1/2 is equal to 2/4. Then 2/4 + 1/4 = 3/4.",
      "topic": "Fractions"
    }
  ]
}`;

    const body = {
      model: model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Groq API error ${res.status}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";

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
