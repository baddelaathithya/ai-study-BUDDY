import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { motion } from 'motion/react';
import { LearningMode, PracticeItemState, Subject } from '../types';
import { MarkdownContent } from './MarkdownContent';

interface PracticeViewProps {
  subject: Subject;
  learningMode: LearningMode;
  topic: string;
  onChangeTopic: (topic: string) => void;
  items: PracticeItemState[];
  isGenerating: boolean;
  error: string | null;
  onGenerateQuestions: (customTopic?: string) => void;
  onUpdateAnswer: (questionId: string, answer: string) => void;
  onToggleHint: (questionId: string) => void;
  onSubmitAnswer: (questionId: string) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  subject,
  learningMode,
  topic,
  onChangeTopic,
  items,
  isGenerating,
  error,
  onGenerateQuestions,
  onUpdateAnswer,
  onToggleHint,
  onSubmitAnswer,
}) => {
  const [localTopic, setLocalTopic] = useState(topic);

  React.useEffect(() => {
    setLocalTopic(topic);
  }, [topic]);

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeTopic(localTopic);
    onGenerateQuestions(localTopic);
  };

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Practice Generator Header */}
        <section className="rounded-xl bg-[#0F172A] border border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-violet-300">
              {subject} <span aria-hidden="true">·</span> {learningMode} Practice
            </p>
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-white">
              Practice Mode (3 Guided Questions)
            </h1>
            <p className="text-sm text-slate-300">
              Enter any topic or use your recent study topic to generate 3 tailored problems.
              Submit your answer on each question for personalized tutor feedback.
            </p>
          </div>

          <form
            onSubmit={handleGenerateSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <input
              type="text"
              value={localTopic}
              onChange={(e) => setLocalTopic(e.target.value)}
              placeholder={`Enter a ${subject} topic (e.g., Quadratic Equations, Binary Search)...`}
              className="flex-1 h-11 rounded-xl bg-[#080D1A] border border-slate-700/80 focus:border-violet-500 focus:outline-none px-4 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{items.length > 0 ? 'Regenerate 3 Questions' : 'Generate 3 Questions'}</span>
            </button>
          </form>

          {error && (
            <div className="rounded-lg bg-rose-950/50 border border-rose-500/40 px-4 py-2.5 text-sm text-rose-200">
              {error}
            </div>
          )}
        </section>

        {/* Loading State */}
        {isGenerating && (
          <div className="rounded-xl bg-[#0F172A] border border-slate-800 p-8 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-sm text-slate-300">
              Crafting 3 {learningMode.toLowerCase()} practice questions for {subject}...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && items.length === 0 && (
          <div className="rounded-xl bg-[#0F172A] border border-slate-800 p-8 text-center space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              Ready to test your understanding?
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Type a topic above and click Generate 3 Questions, or click Practice (3 Questions)
              beneath any AI tutor explanation in the chat.
            </p>
          </div>
        )}

        {/* 3 Practice Question Cards */}
        {!isGenerating && items.length > 0 && (
          <div className="space-y-5 pb-6">
            {items.map((item, idx) => {
              const { question, userAnswer, isSubmitting, evaluation, showHint } = item;
              return (
                <motion.section
                  key={question.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: idx * 0.04 }}
                  className="rounded-xl bg-[#0F172A] border border-slate-800 p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-violet-300">
                        Question 0{idx + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{question.keyConcept}</span>
                      <span aria-hidden="true">·</span>
                      <span>{question.difficulty}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleHint(question.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {showHint ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide Hint</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show Hint</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-slate-100">
                    <MarkdownContent content={question.question} />
                  </div>

                  {showHint && (
                    <div className="rounded-lg bg-blue-950/35 border border-blue-500/30 px-4 py-3 text-sm text-blue-100">
                      <span className="font-semibold text-blue-300">Hint: </span>
                      {question.hint}
                    </div>
                  )}

                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      value={userAnswer}
                      onChange={(e) => onUpdateAnswer(question.id, e.target.value)}
                      placeholder="Write your reasoning, steps, or code answer here..."
                      className="w-full rounded-xl bg-[#080D1A] border border-slate-700/80 focus:border-violet-500 focus:outline-none px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 leading-relaxed"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        {item.error ? (
                          <span className="text-rose-300">{item.error}</span>
                        ) : (
                          'Submit your attempt for step-by-step AI feedback.'
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={!userAnswer.trim() || isSubmitting}
                        onClick={() => onSubmitAnswer(question.id)}
                        className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Check Answer</span>
                      </button>
                    </div>
                  </div>

                  {evaluation && (
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {evaluation.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-emerald-300">
                              {evaluation.verdictLabel}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-amber-300">
                              {evaluation.verdictLabel}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-sm text-slate-200 leading-relaxed">
                        {evaluation.feedback}
                      </p>

                      <div className="pt-2">
                        <p className="text-xs font-semibold text-slate-300 mb-2">
                          Model Solution
                        </p>
                        <MarkdownContent content={evaluation.stepByStepSolution} />
                      </div>

                      <div className="rounded-lg bg-violet-950/30 border border-violet-500/30 px-4 py-3 text-sm text-violet-100">
                        <span className="font-semibold text-violet-300">
                          Key Takeaway:{' '}
                        </span>
                        {evaluation.keyTakeaway}
                      </div>
                    </div>
                  )}
                </motion.section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
