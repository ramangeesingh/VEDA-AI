import { supabase } from "../../lib/supabase";
import { QuestionRequest, VedaMCQ } from "./types";

export class QuestionCache {
  /**
   * Fetches cached questions from the database.
   * If there are enough questions (>= count) matching the criteria,
   * returns a randomized subset of size count. Otherwise, returns an empty array.
   */
  static async getCachedQuestions(req: QuestionRequest): Promise<VedaMCQ[]> {
    try {
      let query = supabase
        .from("questions")
        .select("*")
        .eq("subject", req.subject)
        .eq("class_level", req.classLevel)
        .eq("difficulty", req.difficulty);

      const { data, error } = await query;

      if (error || !data) {
        console.error("Cache fetch error:", error);
        return [];
      }

      // Filter out avoided questions to prevent duplication in this session
      const avoidSet = new Set(req.avoidQuestions || []);
      const available = data.filter((q: any) => !avoidSet.has(q.question));

      // We only use cache if we have enough questions to fulfill the count
      if (available.length >= req.count) {
        // Shuffle and select count questions
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, req.count);

        return selected.map((q: any) => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
          correctAnswer: q.correct_answer,
          explanation: q.explanation || "",
          topic: q.topic,
          difficulty: q.difficulty,
          classLevel: q.class_level,
        }));
      }

      return [];
    } catch (err) {
      console.error("QuestionCache getCachedQuestions catch error:", err);
      return [];
    }
  }

  // saveQuestions: the correct entry point used by FallbackManager (subject passed explicitly)
  static async saveQuestions(
    questions: VedaMCQ[],
    subject: string,
    source: "gemini" | "groq" | "seed"
  ): Promise<void> {
    try {
      const rows = questions.map((q) => ({
        subject: subject,
        topic: q.topic,
        difficulty: q.difficulty,
        class_level: q.classLevel,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        source: source,
      }));

      const { error } = await supabase.from("questions").insert(rows);
      if (error) {
        console.error("Cache insert error:", error);
      }
    } catch (err) {
      console.error("QuestionCache saveQuestions catch error:", err);
    }
  }
}
