import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleTutorChat, handlePracticeQuestions } from "./routes/gemini";
import {
  handleStartAssessment,
  handleGenerateQuestion,
  handleSaveResponse,
  handleExplain,
} from "./routes/assessment";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/tutor", handleTutorChat);
  app.post("/api/practice", handlePracticeQuestions);

  // ─── Assessment Engine ────────────────────────────────────────────
  app.post("/api/assessment/start", handleStartAssessment);      // batch generate + create session
  app.post("/api/assessment/question", handleGenerateQuestion);  // single question (backward compat)
  app.post("/api/assessment/respond", handleSaveResponse);       // save student response
  app.post("/api/explain", handleExplain);                       // AI explanation

  return app;
}
