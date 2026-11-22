import React, { useState } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { ChatTutorView } from './components/ChatTutorView';
import { DashboardView } from './components/DashboardView';
import { PracticeView } from './components/PracticeView';
import { Sidebar } from './components/Sidebar';
import {
  ChatMessage,
  LearningMode,
  PracticeEvaluation,
  PracticeItemState,
  PracticeQuestion,
  StudySessionEntry,
  Subject,
  TutorActionMode,
  WorkspaceTab,
} from './types';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat');
  const [subject, setSubject] = useState<Subject>('Mathematics');
  const [learningMode, setLearningMode] = useState<LearningMode>('Intermediate');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Practice mode state
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceItems, setPracticeItems] = useState<PracticeItemState[]>([]);
  const [isPracticeGenerating, setIsPracticeGenerating] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [practiceCompletedCount, setPracticeCompletedCount] = useState(0);

  // Study dashboard state
  const [sessionHistory, setSessionHistory] = useState<StudySessionEntry[]>([]);
  const [topicsStudied, setTopicsStudied] = useState<string[]>([]);
  const [recentSubjects, setRecentSubjects] = useState<Subject[]>([]);

  const recordStudyActivity = (
    topic: string,
    activeSubject: Subject,
    mode: LearningMode,
    questionText: string,
    actionMode: TutorActionMode
  ) => {
    const cleanTopic = topic.trim() || `${activeSubject} Study`;
    setTopicsStudied((prev) =>
      prev.includes(cleanTopic) ? prev : [cleanTopic, ...prev]
    );
    setRecentSubjects((prev) =>
      prev.includes(activeSubject)
        ? [activeSubject, ...prev.filter((s) => s !== activeSubject)]
        : [activeSubject, ...prev]
    );
    setSessionHistory((prev) => [
      {
        id: makeId(),
        topic: cleanTopic,
        subject: activeSubject,
        learningMode: mode,
        questionSnippet: questionText,
        actionMode,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const sendTutorMessage = async (
    text: string,
    actionMode: TutorActionMode,
    overrideSubject?: Subject
  ) => {
    const activeSubject = overrideSubject ?? subject;
    const trimmed = text.trim();
    if (!trimmed) return;

    setActiveTab('chat');
    setChatError(null);

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      subject: activeSubject,
      learningMode,
      actionMode,
      timestamp: Date.now(),
    };

    const historyForApi = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          subject: activeSubject,
          learningMode,
          actionMode,
        }),
      });

      const data = (await response.json()) as {
        topic?: string;
        answer?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get a response from AI Study Buddy.');
      }

      const topicTitle = data.topic || `${activeSubject} Concept`;
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: data.answer || '',
        subject: activeSubject,
        learningMode,
        actionMode,
        topic: topicTitle,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setPracticeTopic(topicTitle);
      recordStudyActivity(
        topicTitle,
        activeSubject,
        learningMode,
        trimmed,
        actionMode
      );
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'Unable to reach the tutor service.'
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFollowUpAction = (
    sourceMessage: ChatMessage,
    mode: 'explain_simply' | 'step_by_step' | 'examples'
  ) => {
    const topicHint = sourceMessage.topic ? ` (${sourceMessage.topic})` : '';
    const prompts: Record<'explain_simply' | 'step_by_step' | 'examples', string> = {
      explain_simply: `Explain this concept${topicHint} in very simple, everyday language with an easy analogy and a short example.`,
      step_by_step: `Break down this problem or concept${topicHint} into clear, numbered step-by-step instructions and verify the result.`,
      examples: `Generate 3 distinct real-world examples showing how this concept${topicHint} works in practice.`,
    };
    sendTutorMessage(prompts[mode], mode, sourceMessage.subject);
  };

  const generatePracticeQuestions = async (
    customTopic?: string,
    context?: string,
    overrideSubject?: Subject
  ) => {
    const activeSubject = overrideSubject ?? subject;
    const targetTopic =
      (customTopic ?? practiceTopic).trim() || `Core concepts in ${activeSubject}`;
    setPracticeTopic(targetTopic);
    setPracticeError(null);
    setIsPracticeGenerating(true);

    try {
      const response = await fetch('/api/tutor/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          subject: activeSubject,
          learningMode,
          context: context || '',
        }),
      });

      const data = (await response.json()) as {
        topic?: string;
        questions?: PracticeQuestion[];
        error?: string;
      };

      if (!response.ok || !data.questions) {
        throw new Error(data.error || 'Could not generate practice questions.');
      }

      setPracticeItems(
        data.questions.map((q) => ({
          question: q,
          userAnswer: '',
          isSubmitting: false,
          evaluation: null,
          showHint: false,
          error: null,
        }))
      );
    } catch (err) {
      setPracticeError(
        err instanceof Error ? err.message : 'Failed to generate practice questions.'
      );
    } finally {
      setIsPracticeGenerating(false);
    }
  };

  const handleStartPracticeFromTopic = (
    topic: string,
    context: string,
    overrideSubject?: Subject
  ) => {
    if (overrideSubject) {
      setSubject(overrideSubject);
    }
    setActiveTab('practice');
    generatePracticeQuestions(topic, context, overrideSubject);
  };

  const handleUpdatePracticeAnswer = (questionId: string, answer: string) => {
    setPracticeItems((prev) =>
      prev.map((item) =>
        item.question.id === questionId
          ? { ...item, userAnswer: answer, error: null }
          : item
      )
    );
  };

  const handleToggleHint = (questionId: string) => {
    setPracticeItems((prev) =>
      prev.map((item) =>
        item.question.id === questionId
          ? { ...item, showHint: !item.showHint }
          : item
      )
    );
  };

  const handleSubmitPracticeAnswer = async (questionId: string) => {
    const target = practiceItems.find((item) => item.question.id === questionId);
    if (!target || !target.userAnswer.trim()) return;

    setPracticeItems((prev) =>
      prev.map((item) =>
        item.question.id === questionId
          ? { ...item, isSubmitting: true, error: null }
          : item
      )
    );

    try {
      const response = await fetch('/api/tutor/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: target.question.question,
          studentAnswer: target.userAnswer,
          subject,
          learningMode,
        }),
      });

      const data = (await response.json()) as PracticeEvaluation & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Unable to check your answer right now.');
      }

      const wasFirstEval = target.evaluation === null;
      setPracticeItems((prev) =>
        prev.map((item) =>
          item.question.id === questionId
            ? { ...item, isSubmitting: false, evaluation: data }
            : item
        )
      );
      if (wasFirstEval) {
        setPracticeCompletedCount((c) => c + 1);
      }
    } catch (err) {
      setPracticeItems((prev) =>
        prev.map((item) =>
          item.question.id === questionId
            ? {
                ...item,
                isSubmitting: false,
                error:
                  err instanceof Error ? err.message : 'Error evaluating answer.',
              }
            : item
        )
      );
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setChatError(null);
    setActiveTab('chat');
  };

  const handleResetSession = () => {
    setMessages([]);
    setChatError(null);
    setPracticeTopic('');
    setPracticeItems([]);
    setPracticeError(null);
    setPracticeCompletedCount(0);
    setSessionHistory([]);
    setTopicsStudied([]);
    setRecentSubjects([]);
    setActiveTab('chat');
  };

  const tabTitles: Record<WorkspaceTab, string> = {
    chat: 'AI Chat Tutor & Doubt Solver',
    practice: 'Practice Mode',
    dashboard: 'Study Dashboard',
  };

  return (
    <div className="min-h-screen h-screen flex bg-[#080D1A] text-slate-100 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        subject={subject}
        onSelectSubject={setSubject}
        learningMode={learningMode}
        onSelectLearningMode={setLearningMode}
        onPickSuggestedQuestion={(q) => sendTutorMessage(q, 'tutor')}
        onClearChat={handleClearChat}
        onResetSession={handleResetSession}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        questionsAskedCount={sessionHistory.length}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Clean Workspace Top Bar */}
        <header className="h-14 shrink-0 border-b border-slate-800/80 bg-[#0A1020] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-display text-sm sm:text-base font-semibold text-white truncate">
              {tabTitles[activeTab]}
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-200 font-medium">{subject}</span>
              <span aria-hidden="true">·</span>
              <span>{learningMode}</span>
            </div>

            {activeTab !== 'practice' ? (
              <button
                type="button"
                onClick={() => setActiveTab('practice')}
                className="px-3.5 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/35 text-violet-200 hover:text-white border border-violet-500/35 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practice Mode</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Back to Tutor
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 min-h-0">
          {activeTab === 'chat' && (
            <ChatTutorView
              messages={messages}
              subject={subject}
              learningMode={learningMode}
              isLoading={isChatLoading}
              error={chatError}
              onDismissError={() => setChatError(null)}
              onSendMessage={(text, mode) => sendTutorMessage(text, mode)}
              onFollowUpAction={handleFollowUpAction}
              onStartPracticeFromTopic={(topic, ctx) =>
                handleStartPracticeFromTopic(topic, ctx)
              }
            />
          )}

          {activeTab === 'practice' && (
            <PracticeView
              subject={subject}
              learningMode={learningMode}
              topic={practiceTopic}
              onChangeTopic={setPracticeTopic}
              items={practiceItems}
              isGenerating={isPracticeGenerating}
              error={practiceError}
              onGenerateQuestions={(custom) =>
                generatePracticeQuestions(custom)
              }
              onUpdateAnswer={handleUpdatePracticeAnswer}
              onToggleHint={handleToggleHint}
              onSubmitAnswer={handleSubmitPracticeAnswer}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              questionsAsked={sessionHistory.length}
              topicsStudied={topicsStudied}
              recentSubjects={recentSubjects}
              sessionHistory={sessionHistory}
              practiceCompletedCount={practiceCompletedCount}
              onJumpToTopic={(topic, subj) =>
                handleStartPracticeFromTopic(topic, '', subj)
              }
              onStartChat={() => setActiveTab('chat')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
