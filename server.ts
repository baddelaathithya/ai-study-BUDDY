import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in the Settings > Secrets panel or .env file.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const errMsg = error instanceof Error ? error.message : String(error);
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('500') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('ECONNRESET');
      if (!isTransient || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw lastError;
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const msg = error instanceof Error ? error.message : 'Unexpected server error.';
  if (msg.includes('GEMINI_API_KEY is not configured')) {
    return { status: 500, message: msg };
  }
  if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
    return {
      status: 400,
      message:
        'Invalid Gemini API key or malformed request. Please check your key in Settings > Secrets.',
    };
  }
  if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return {
      status: 403,
      message:
        'Permission denied by Gemini API. Please verify your API key in Settings > Secrets.',
    };
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return {
      status: 429,
      message:
        'Rate limit reached on Gemini API. Please wait a moment and try again.',
    };
  }
  return { status: 500, message: msg };
}

function buildTutorSystemInstruction(
  subject: string,
  learningMode: string,
  actionMode: string
): string {
  const levelGuide: Record<string, string> = {
    Beginner:
      'Use simple, approachable everyday language, intuitive analogies, short paragraphs, and define any technical terms clearly.',
    Intermediate:
      'Use clear college/high-school academic rigor, connect underlying principles, include structured equations or code snippets, and highlight common pitfalls.',
    Advanced:
      'Provide deep theoretical insight, formal mathematical or algorithmic notation, edge cases, complexity/rigor considerations, and nuanced details.',
  };

  const modeGuide: Record<string, string> = {
    tutor:
      'Act as a supportive personal AI tutor. Explain the concept clearly with concrete examples. If the student asks a math, physics, chemistry, or programming problem, ALWAYS break down the solution step-by-step instead of giving only the final answer.',
    step_by_step:
      'Deliver a rigorous Step-by-Step Solver response. Break the solution into clearly numbered steps (Step 1, Step 2, ...), explain WHY each step is performed, show intermediate calculations or code traces, and conclude with a concise verification check.',
    explain_simply:
      'Explain Simply Mode: Rewrite or explain the concept in ultra-simple, jargon-free language as if teaching a curious friend over coffee. Use a vivid everyday analogy and one crystal-clear micro-example.',
    examples:
      'Real-World Example Generator Mode: Provide 3 distinct, memorable real-world examples or practical applications of this topic. For each example, give a short title, explain how the concept works in practice, and summarize why it matters.',
  };

  return [
    `You are AI Study Buddy, a dedicated personal AI tutor specializing in ${subject}.`,
    `Student Learning Level: ${learningMode}. ${levelGuide[learningMode] ?? levelGuide.Intermediate}`,
    `Response Style: ${modeGuide[actionMode] ?? modeGuide.tutor}`,
    'Format cleanly using Markdown headings, numbered steps, bullet points, and fenced code blocks where helpful.',
    'Keep formatting scannable and accurate. Never invent fake references.',
  ].join('\n\n');
}

interface IncomingHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/tutor/chat', async (req: Request, res: Response) => {
    try {
      const {
        message,
        history = [],
        subject = 'General Subjects',
        learningMode = 'Intermediate',
        actionMode = 'tutor',
      } = req.body as {
        message?: string;
        history?: IncomingHistoryItem[];
        subject?: string;
        learningMode?: string;
        actionMode?: string;
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Please enter a question or topic to study.' });
        return;
      }

      const ai = getGeminiClient();
      const systemInstruction = buildTutorSystemInstruction(
        subject,
        learningMode,
        actionMode
      );

      const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
      const contents = [
        ...recentHistory.map((item) => ({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }],
        })),
        {
          role: 'user',
          parts: [{ text: message.trim() }],
        },
      ];

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topicTitle: {
                  type: Type.STRING,
                  description:
                    'A concise 2 to 5 word academic topic label summarizing the core concept discussed.',
                },
                answerMarkdown: {
                  type: Type.STRING,
                  description:
                    'The complete, rich Markdown explanation, step-by-step derivation, examples, or simplified breakdown for the student.',
                },
              },
              required: ['topicTitle', 'answerMarkdown'],
            },
          },
        })
      );

      const raw = (response.text ?? '').trim();
      let parsed: { topicTitle?: string; answerMarkdown?: string } = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {
          topicTitle: `${subject} Study`,
          answerMarkdown: raw || 'I could not generate a response. Please try again.',
        };
      }

      res.json({
        topic: parsed.topicTitle?.trim() || `${subject} Concept`,
        answer:
          parsed.answerMarkdown?.trim() ||
          'I could not generate an explanation. Please try rephrasing your question.',
      });
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/tutor/practice', async (req: Request, res: Response) => {
    try {
      const {
        topic,
        subject = 'General Subjects',
        learningMode = 'Intermediate',
        context = '',
      } = req.body as {
        topic?: string;
        subject?: string;
        learningMode?: string;
        context?: string;
      };

      const cleanTopic = topic?.trim() || `Core concepts in ${subject}`;
      const ai = getGeminiClient();

      const prompt = [
        `Generate exactly 3 practice questions for a ${learningMode}-level student studying "${cleanTopic}" in ${subject}.`,
        context ? `Recent lesson context:\n${context.slice(0, 1200)}` : '',
        'Make the 3 questions progress gently in challenge (Question 1: foundational check, Question 2: applied problem, Question 3: deeper reasoning or synthesis).',
        'For math or programming topics, include concrete numbers or short code snippets to trace/write.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction: `You are an expert ${subject} educator creating 3 thoughtful open-ended practice questions calibrated to ${learningMode} learners.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      question: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                      hint: { type: Type.STRING },
                      keyConcept: { type: Type.STRING },
                    },
                    required: ['id', 'question', 'difficulty', 'hint', 'keyConcept'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        })
      );

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw) as {
        questions?: Array<{
          id: string;
          question: string;
          difficulty: string;
          hint: string;
          keyConcept: string;
        }>;
      };

      const questions = (parsed.questions ?? []).slice(0, 3).map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        question: q.question,
        difficulty: q.difficulty || learningMode,
        hint: q.hint,
        keyConcept: q.keyConcept || cleanTopic,
      }));

      if (questions.length === 0) {
        res.status(500).json({ error: 'Could not generate practice questions. Please try again.' });
        return;
      }

      res.json({ topic: cleanTopic, questions });
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/tutor/evaluate', async (req: Request, res: Response) => {
    try {
      const {
        question,
        studentAnswer,
        subject = 'General Subjects',
        learningMode = 'Intermediate',
      } = req.body as {
        question?: string;
        studentAnswer?: string;
        subject?: string;
        learningMode?: string;
      };

      if (!question || !studentAnswer || !studentAnswer.trim()) {
        res.status(400).json({ error: 'Please write your answer before submitting for feedback.' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = [
        `Subject: ${subject}`,
        `Student Level: ${learningMode}`,
        `Practice Question: ${question}`,
        `Student's Answer: ${studentAnswer.trim()}`,
        'Evaluate the student answer kindly and accurately. Explain what they got right, clarify any misconception, provide a clear step-by-step model solution, and finish with one memorable key takeaway.',
      ].join('\n\n');

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a patient, encouraging personal AI tutor giving constructive feedback on a student practice attempt.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isCorrect: {
                  type: Type.BOOLEAN,
                  description: 'True if the student answer demonstrates solid correctness, false if incomplete or incorrect.',
                },
                verdictLabel: {
                  type: Type.STRING,
                  description: 'Short clear label such as "Correct", "Partially Correct", or "Needs Review".',
                },
                feedback: {
                  type: Type.STRING,
                  description: 'Personalized feedback addressing the student attempt directly.',
                },
                stepByStepSolution: {
                  type: Type.STRING,
                  description: 'Clear Markdown step-by-step model solution.',
                },
                keyTakeaway: {
                  type: Type.STRING,
                  description: 'One concise takeaway sentence to remember.',
                },
              },
              required: [
                'isCorrect',
                'verdictLabel',
                'feedback',
                'stepByStepSolution',
                'keyTakeaway',
              ],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Study Buddy server running at http://localhost:${PORT}`);
  });
}

startServer();
