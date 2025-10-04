import { RequestHandler } from "express";
import { GeminiTutorRequest, GeminiTutorResponse } from "@shared/geminiTypes";
import { GeminiPracticeRequest, GeminiPracticeResponse } from "@shared/practiceTypes";

export const handleTutorChat: RequestHandler = async (req, res) => {
  try {
    const { question, grade, conversationHistory }: GeminiTutorRequest = req.body;
    
    const prompt = createTutorPrompt(question, grade, conversationHistory);
    const response = await callGeminiAPI(prompt, grade);
    
    const result: GeminiTutorResponse = {
      response,
      success: true
    };
    
    res.json(result);
  } catch (error) {
    const result: GeminiTutorResponse = {
      response: "I'm having trouble right now. Please try again!",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(result);
  }
};

function createTutorPrompt(question: string, grade: string, history: any[]): string {
  const gradeContext = getGradeContext(grade);
  
  return `You are a tutor for ${grade} students. ${gradeContext}

Question: ${question}

Give a short, direct answer only.`;
}

function getGradeContext(grade: string): string {
  if (grade === "Nursery" || grade === "KG") {
    return "Answer in 1 short sentence only. Use very simple words.";
  } else if (["1","2","3","4","5"].includes(grade)) {
    return "Answer in 1-2 short sentences only. Use simple language.";
  } else if (["6","7","8"].includes(grade)) {
    return "Answer in 1-2 sentences only. Be direct and clear.";
  } else {
    return "Answer in 1-2 sentences only. Be concise and direct.";
  }
}

async function callGeminiAPI(prompt: string, grade: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-2.5-flash";
  
  console.log('Using model:', model);
  console.log('API Key exists:', !!apiKey);
  
  const maxTokens = 2000;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        maxOutputTokens: maxTokens, 
        temperature: 0.7 
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Gemini API Error:', errorData);
    throw new Error(`API Error: ${response.status}`);
  }
  
  const data = await response.json();
  
  const candidate = data.candidates?.[0];
  if (!candidate) {
    return "I couldn't generate a response right now.";
  }
  
  // Handle different response structures
  const text = candidate.content?.parts?.[0]?.text || 
               candidate.text || 
               candidate.content?.text;
               
  if (!text) {
    if (candidate.finishReason === 'MAX_TOKENS') {
      return "Let me give you a shorter answer. Can you ask a more specific question?";
    }
    return "I couldn't generate a response right now.";
  }
  
  // Clean up markdown and LaTeX formatting
  const cleanText = text ? text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\log/g, 'log')
    .replace(/\\ln/g, 'ln')
    .replace(/\\int/g, '∫')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\sqrt/g, '√')
    .replace(/\\infty/g, '∞')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡') : null;
  
  return cleanText || "I couldn't generate a response right now.";
}

export const handlePracticeQuestions: RequestHandler = async (req, res) => {
  try {
    const { grade, subject, difficulty, count }: GeminiPracticeRequest = req.body;
    
    const prompt = createPracticePrompt(grade, subject, difficulty, count);
    const response = await callGeminiAPI(prompt, grade);
    
    const questions = parsePracticeResponse(response, count);
    
    const result: GeminiPracticeResponse = {
      questions,
      success: true
    };
    
    res.json(result);
  } catch (error) {
    const result: GeminiPracticeResponse = {
      questions: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(result);
  }
};

function createPracticePrompt(grade: string, subject: string, difficulty: string, count: number): string {
  return `Create ${count} MCQ questions for Class ${grade} ${subject}.

Format:
Q1: What is 2+2?
A) 3
B) 4
C) 5
D) 6
Answer: B

Q2: What is 3+3?
A) 5
B) 6
C) 7
D) 8
Answer: B

Now create ${count} questions:`;
}

function parsePracticeResponse(response: string, count: number): any[] {
  console.log('Raw Gemini response:', response);
  const questions = [];
  const lines = response.split('\n');
  let currentQ = null;
  let options = [];
  let correctAnswer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('Q')) {
      if (currentQ && options.length === 4) {
        questions.push({
          id: questions.length.toString(),
          text: currentQ,
          options: options.map((opt, idx) => ({
            id: `${questions.length}-${idx}`,
            label: opt,
            correct: String.fromCharCode(65 + idx) === correctAnswer
          }))
        });
      }
      currentQ = line.split(': ')[1] || line;
      options = [];
      correctAnswer = '';
    } else if (line.match(/^[A-D]\)/)) {
      options.push(line.substring(3));
    } else if (line.startsWith('Correct:') || line.startsWith('Answer:')) {
      correctAnswer = line.split(': ')[1] || line.split(' ')[1];
    }
  }
  
  if (currentQ && options.length === 4) {
    questions.push({
      id: questions.length.toString(),
      text: currentQ,
      options: options.map((opt, idx) => ({
        id: `${questions.length}-${idx}`,
        label: opt,
        correct: String.fromCharCode(65 + idx) === correctAnswer
      }))
    });
  }
  
  console.log('Parsed questions:', questions);
  return questions.slice(0, count);
}