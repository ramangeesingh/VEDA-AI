import { supabase } from "../../lib/supabase";
import { GeminiProvider } from "./GeminiProvider";
import { GroqProvider } from "./GroqProvider";
import { SeedProvider } from "./SeedProvider";
import { QuestionCache } from "./QuestionCache";
import { QuestionRequest, VedaMCQ } from "./types";

export class FallbackManager {
  private static providers = [
    new GeminiProvider(),
    new GroqProvider(),
    new SeedProvider(), // Ultimate local fallback
  ];

  /**
   * Generates questions using the fallback sequence:
   * Cache -> Gemini -> Groq -> Seed
   */
  static async generateQuestions(req: QuestionRequest): Promise<VedaMCQ[]> {
    console.log(
      `[FallbackManager] Generating ${req.count} questions. Subject: ${req.subject}, Level: ${req.classLevel}, Difficulty: ${req.difficulty}`
    );

    // ─── 1. Check Supabase Cache First ───
    try {
      const cached = await QuestionCache.getCachedQuestions(req);
      if (cached && cached.length >= req.count) {
        console.log(`[FallbackManager] Cache hit! Retrieved ${cached.length} questions.`);
        return cached;
      }
      console.log(`[FallbackManager] Cache miss or insufficient questions. Proceeding to AI...`);
    } catch (cacheErr) {
      console.error("[FallbackManager] Cache lookup error:", cacheErr);
    }

    // ─── 2. Fallback AI providers loop ───
    for (const provider of this.providers) {
      const startTime = Date.now();
      try {
        console.log(`[FallbackManager] Trying provider: ${provider.name}`);
        const questions = await provider.generateQuestions(req);

        if (questions && questions.length >= req.count) {
          const duration = Date.now() - startTime;
          console.log(`[FallbackManager] Provider ${provider.name} succeeded in ${duration}ms.`);

          // Log success asynchronously
          this.logAttempt(provider.name, true, duration).catch(console.error);

          // Save to cache asynchronously (only if it is a real AI provider to avoid seeding duplicate seeds)
          if (provider.name !== "seed") {
            QuestionCache.saveQuestions(questions, req.subject, provider.name as any).catch(
              console.error
            );
          }

          return questions;
        }

        throw new Error("Provider returned insufficient questions count");
      } catch (err: any) {
        const duration = Date.now() - startTime;
        const errorMsg = err?.message || String(err);
        console.warn(
          `[FallbackManager] Provider ${provider.name} failed in ${duration}ms. Error: ${errorMsg}`
        );

        // Log failure asynchronously
        this.logAttempt(provider.name, false, duration, errorMsg).catch(console.error);
      }
    }

    // ─── 3. Absolute Fallback: Static Seeds ───
    // If all providers (including SeedProvider fallback check) fail, try one last static fetch
    console.error("[FallbackManager] All fallback providers failed. Returning emergency seeds.");
    const emergencySeed = new SeedProvider();
    return emergencySeed.generateQuestions(req);
  }

  /**
   * Helper to write logs to question_generation_logs table
   */
  private static async logAttempt(
    provider: string,
    success: boolean,
    durationMs: number,
    errorMsg?: string
  ): Promise<void> {
    try {
      await supabase.from("question_generation_logs").insert({
        provider_used: provider,
        success: success,
        failure_reason: errorMsg || null,
        generation_time: durationMs,
      });
    } catch (err) {
      console.error("[FallbackManager] Failed to write generation log:", err);
    }
  }
}
