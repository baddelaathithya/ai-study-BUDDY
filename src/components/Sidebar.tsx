import React from 'react';
import {
  BarChart3,
  BookOpen,
  CheckSquare,
  GraduationCap,
  MessageSquare,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  LEARNING_MODES,
  LearningMode,
  SUBJECTS,
  SUGGESTED_QUESTIONS,
  Subject,
  WorkspaceTab,
} from '../types';

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  subject: Subject;
  onSelectSubject: (subject: Subject) => void;
  learningMode: LearningMode;
  onSelectLearningMode: (mode: LearningMode) => void;
  onPickSuggestedQuestion: (question: string) => void;
  onClearChat: () => void;
  onResetSession: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  questionsAskedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  subject,
  onSelectSubject,
  learningMode,
  onSelectLearningMode,
  onPickSuggestedQuestion,
  onClearChat,
  onResetSession,
  isOpenMobile,
  onCloseMobile,
  questionsAskedCount,
}) => {
  const navItems: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'chat',
      label: 'AI Chat Tutor',
      icon: <MessageSquare className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'practice',
      label: 'Practice Mode',
      icon: <CheckSquare className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'dashboard',
      label: 'Study Dashboard',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
  ];

  const suggestedForSubject = SUGGESTED_QUESTIONS[subject];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0C1324] border-r border-slate-800/80 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-white truncate">
            AI Study Buddy
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Navigation Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Primary Navigation */}
        <nav aria-label="Workspace navigation" className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-violet-600/20 text-white border border-violet-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-violet-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                {item.id === 'dashboard' && questionsAskedCount > 0 && (
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {questionsAskedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Learning Mode */}
        <div className="pt-2 border-t border-slate-800/70">
          <p className="text-xs font-medium text-slate-400 mb-2.5 px-1">
            Learning Mode
          </p>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#080D1A] border border-slate-800/80">
            {LEARNING_MODES.map((mode) => {
              const active = learningMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelectLearningMode(mode)}
                  className={`py-1.5 px-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap truncate ${
                    active
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Selection */}
        <div className="pt-2 border-t border-slate-800/70">
          <div className="flex items-center justify-between px-1 mb-2.5">
            <p className="text-xs font-medium text-slate-400">Subject</p>
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="space-y-1">
            {SUBJECTS.map((subj) => {
              const active = subject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => onSelectSubject(subj)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer truncate ${
                    active
                      ? 'bg-blue-600/20 text-blue-200 border border-blue-500/35'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="pt-2 border-t border-slate-800/70">
          <p className="text-xs font-medium text-slate-400 mb-2.5 px-1">
            Suggested Questions
          </p>
          <div className="space-y-1.5">
            {suggestedForSubject.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  onPickSuggestedQuestion(q);
                  onCloseMobile();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs leading-relaxed text-slate-300 hover:text-white bg-[#080D1A]/70 hover:bg-slate-800/70 border border-slate-800/80 transition-colors cursor-pointer line-clamp-2"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session Controls Footer */}
      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <button
          type="button"
          onClick={onClearChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
        <button
          type="button"
          onClick={onResetSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-200 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block w-[272px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-[280px] max-w-[85vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
