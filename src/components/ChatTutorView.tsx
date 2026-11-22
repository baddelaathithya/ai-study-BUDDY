import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckSquare,
  Copy,
  Lightbulb,
  ListOrdered,
  Loader2,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ChatMessage,
  LearningMode,
  SUGGESTED_QUESTIONS,
  Subject,
  TutorActionMode,
} from '../types';
import { MarkdownContent } from './MarkdownContent';

interface ChatTutorViewProps {
  messages: ChatMessage[];
  subject: Subject;
  learningMode: LearningMode;
  isLoading: boolean;
  error: string | null;
  onDismissError: () => void;
  onSendMessage: (text: string, mode: TutorActionMode) => void;
  onFollowUpAction: (
    sourceMessage: ChatMessage,
    mode: 'explain_simply' | 'step_by_step' | 'examples'
  ) => void;
  onStartPracticeFromTopic: (topic: string, context: string) => void;
}

const ACTION_MODES: Array<{
  id: TutorActionMode;
  label: string;
  description: string;
}> = [
  {
    id: 'tutor',
    label: 'Auto Tutor',
    description: 'Balanced explanation and problem solving',
  },
  {
    id: 'step_by_step',
    label: 'Step-by-Step',
    description: 'Detailed numbered derivation or code trace',
  },
  {
    id: 'explain_simply',
    label: 'Explain Simply',
    description: 'Simple everyday language with analogies',
  },
  {
    id: 'examples',
    label: 'Examples',
    description: '3 real-world practical applications',
  },
];

export const ChatTutorView: React.FC<ChatTutorViewProps> = ({
  messages,
  subject,
  learningMode,
  isLoading,
  error,
  onDismissError,
  onSendMessage,
  onFollowUpAction,
  onStartPracticeFromTopic,
}) => {
  const [input, setInput] = useState('');
  const [composerMode, setComposerMode] = useState<TutorActionMode>('tutor');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed, composerMode);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopyAnswer = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 1800);
  };

  const starterPrompts = SUGGESTED_QUESTIONS[subject];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Main Scrollable Thread */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="py-6 sm:py-10"
            >
              <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-slate-800/80">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border border-slate-700/60 bg-[#0F172A] shrink-0 flex items-center justify-center">
                  {!imageFailed ? (
                    <img
                      src="/src/assets/images/study_buddy_emblem_1795350957742.jpg"
                      alt="Geometric open book and celestial astrolabe study emblem"
                      referrerPolicy="no-referrer"
                      onError={() => setImageFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-950 to-violet-950 flex flex-col items-center justify-center p-4 text-center">
                      <Sparkles className="w-8 h-8 text-violet-300 mb-2" />
                      <span className="text-xs font-medium text-slate-300">
                        AI Study Buddy
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-center md:text-left">
                  <p className="text-xs font-medium text-violet-300">
                    {subject} <span aria-hidden="true">·</span> {learningMode} Level
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight text-balance">
                    Ask any doubt, solve problems step by step, and master concepts faster.
                  </h1>
                  <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-2xl">
                    Submit a math equation, programming bug, science theory, or essay question.
                    Your tutor adapts every explanation to your selected level and lets you simplify,
                    explore real-world examples, or jump into 3 guided practice questions.
                  </p>
                </div>
              </div>

              {/* Starter Prompt Cards */}
              <div className="pt-8">
                <h2 className="font-display text-sm font-semibold text-slate-200 mb-4">
                  Sample questions for {subject}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {starterPrompts.map((prompt, index) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onSendMessage(prompt, composerMode)}
                      className="text-left p-4 rounded-xl bg-[#0F172A] hover:bg-[#15203B] border border-slate-800 hover:border-violet-500/45 transition-colors cursor-pointer flex flex-col justify-between gap-4"
                    >
                      <span className="text-sm text-slate-200 leading-relaxed">
                        {prompt}
                      </span>
                      <span className="text-xs font-medium text-violet-300">
                        0{index + 1}. Ask Tutor
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.article
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={
                      isUser
                        ? 'ml-auto max-w-2xl rounded-xl bg-gradient-to-br from-blue-600/25 to-violet-600/25 border border-violet-500/35 px-5 py-4'
                        : 'rounded-xl bg-[#0F172A] border border-slate-800/90 px-5 sm:px-6 py-5'
                    }
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {isUser ? 'You' : 'AI Study Buddy'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{msg.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span>{msg.learningMode}</span>
                        {msg.topic && !isUser && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-violet-300 font-medium">
                              {msg.topic}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="font-mono tabular-nums text-[11px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {isUser ? (
                      <p className="text-[15px] leading-relaxed text-slate-100 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    ) : (
                      <>
                        <MarkdownContent content={msg.content} />

                        {/* Interactive Tutor Action Toolbar */}
                        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => onFollowUpAction(msg, 'explain_simply')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-violet-600/25 text-slate-200 hover:text-white border border-slate-700/70 hover:border-violet-500/40 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-violet-300" />
                            <span>Explain Simply</span>
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => onFollowUpAction(msg, 'step_by_step')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-blue-600/25 text-slate-200 hover:text-white border border-slate-700/70 hover:border-blue-500/40 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            <ListOrdered className="w-3.5 h-3.5 text-blue-300" />
                            <span>Step-by-Step</span>
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => onFollowUpAction(msg, 'examples')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-violet-600/25 text-slate-200 hover:text-white border border-slate-700/70 hover:border-violet-500/40 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                            <span>Real-World Examples</span>
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              onStartPracticeFromTopic(
                                msg.topic || `${msg.subject} Practice`,
                                msg.content
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/20 hover:bg-violet-600/35 text-violet-200 hover:text-white border border-violet-500/35 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-violet-300" />
                            <span>Practice (3 Questions)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyAnswer(msg.id, msg.content)}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.article>
                );
              })}

              {isLoading && (
                <div className="rounded-xl bg-[#0F172A] border border-slate-800 px-5 py-4 flex items-center gap-3 text-sm text-slate-300">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
                  <span>Preparing your {learningMode.toLowerCase()} explanation...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 sm:px-8 pb-2">
          <div className="max-w-4xl mx-auto rounded-lg bg-rose-950/50 border border-rose-500/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-rose-200">
            <span>{error}</span>
            <button
              type="button"
              onClick={onDismissError}
              className="text-xs font-medium text-rose-100 underline hover:no-underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-slate-800/80 bg-[#0A1020] px-4 sm:px-8 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-3">
          {/* Quick Mode Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {ACTION_MODES.map((m) => {
              const active = composerMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  title={m.description}
                  onClick={() => setComposerMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-violet-600 text-white'
                      : 'bg-[#0F172A] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-end gap-3">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask a ${subject} question or paste a problem to solve (${learningMode} level)...`}
              className="flex-1 resize-none rounded-xl bg-[#0F172A] border border-slate-700/80 focus:border-violet-500 focus:outline-none px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 leading-relaxed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Ask Tutor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
