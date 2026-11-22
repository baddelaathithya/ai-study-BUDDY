export const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'Programming',
  'Artificial Intelligence',
  'English',
  'General Subjects',
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const LEARNING_MODES = ['Beginner', 'Intermediate', 'Advanced'] as const;

export type LearningMode = (typeof LEARNING_MODES)[number];

export type TutorActionMode =
  | 'tutor'
  | 'step_by_step'
  | 'explain_simply'
  | 'examples';

export type WorkspaceTab = 'chat' | 'practice' | 'dashboard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  subject: Subject;
  learningMode: LearningMode;
  actionMode: TutorActionMode;
  topic?: string;
  timestamp: number;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  difficulty: string;
  hint: string;
  keyConcept: string;
}

export interface PracticeEvaluation {
  isCorrect: boolean;
  verdictLabel: string;
  feedback: string;
  stepByStepSolution: string;
  keyTakeaway: string;
}

export interface PracticeItemState {
  question: PracticeQuestion;
  userAnswer: string;
  isSubmitting: boolean;
  evaluation: PracticeEvaluation | null;
  showHint: boolean;
  error: string | null;
}

export interface StudySessionEntry {
  id: string;
  topic: string;
  subject: Subject;
  learningMode: LearningMode;
  questionSnippet: string;
  actionMode: TutorActionMode;
  timestamp: number;
}

export const SUGGESTED_QUESTIONS: Record<Subject, string[]> = {
  Mathematics: [
    'Solve 2x^2 - 5x - 3 = 0 step by step using factoring and the quadratic formula.',
    'Explain what derivatives mean intuitively and find the derivative of f(x) = 3x^3 - 4x + 7.',
    'Why does matrix multiplication require rows to match columns?',
  ],
  Physics: [
    'Explain Newton’s Second Law with a real-world elevator acceleration problem.',
    'What is the difference between potential energy and kinetic energy in a roller coaster?',
    'How does electromagnetic induction generate electricity in a power plant?',
  ],
  Chemistry: [
    'Balance the chemical equation: Fe + O2 -> Fe2O3 and explain the steps.',
    'Explain covalent vs. ionic bonding using everyday compounds.',
    'What does pH actually measure in terms of hydrogen ion concentration?',
  ],
  'Computer Science': [
    'Explain Big-O time complexity with O(1), O(log n), O(n), and O(n^2) examples.',
    'How does a hash table handle collisions using chaining vs. open addressing?',
    'Explain how TCP three-way handshake guarantees reliable communication.',
  ],
  Programming: [
    'Write and trace a recursive Python function for binary search step by step.',
    'Explain the difference between stack and heap memory with code examples.',
    'Why do async/await and promises prevent blocking in JavaScript?',
  ],
  'Artificial Intelligence': [
    'How does gradient descent minimize a loss function in neural networks?',
    'Explain overfitting vs. underfitting and how regularization helps.',
    'How does self-attention work inside a Transformer model?',
  ],
  English: [
    'How do I structure a persuasive academic essay thesis and topic sentences?',
    'Explain the difference between active and passive voice with clear examples.',
    'Analyze the literary use of foreshadowing and symbolism in storytelling.',
  ],
  'General Subjects': [
    'How can I use active recall and spaced repetition to prepare for final exams?',
    'Explain supply and demand equilibrium when a market experiences a shortage.',
    'What caused the Industrial Revolution and how did it reshape global society?',
  ],
};
