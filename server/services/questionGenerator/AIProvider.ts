import { QuestionRequest, VedaMCQ } from "./types";

export interface AIProvider {
  name: string;
  generateQuestions(req: QuestionRequest): Promise<VedaMCQ[]>;
}
