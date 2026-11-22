import React from 'react';
import { ArrowUpRight, BookOpen, CheckSquare, Clock, MessageSquare } from 'lucide-react';
import { StudySessionEntry, Subject } from '../types';

interface DashboardViewProps {
  questionsAsked: number;
  topicsStudied: string[];
  recentSubjects: Subject[];
  sessionHistory: StudySessionEntry[];
  practiceCompletedCount: number;
  onJumpToTopic: (topic: string, subject: Subject) => void;
  onStartChat: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  questionsAsked,
  topicsStudied,
  recentSubjects,
  sessionHistory,
  practiceCompletedCount,
  onJumpToTopic,
  onStartChat,
}) => {
  const metrics = [
    {
      label: 'Questions Asked',
      value: questionsAsked,
      icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
    },
    {
      label: 'Topics Studied',
      value: topicsStudied.length,
      icon: <BookOpen className="w-4 h-4 text-violet-400" />,
    },
    {
      label: 'Practice Checked',
      value: practiceCompletedCount,
      icon: <CheckSquare className="w-4 h-4 text-emerald-400" />,
    },
    {
      label: 'Subjects Explored',
      value: recentSubjects.length,
      icon: <Clock className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold text-white">
            Study Dashboard
          </h1>
          <p className="text-sm text-slate-300">
            Track your active study session, topics covered, recently explored subjects,
            and question history.
          </p>
        </header>

        {/* 4-Column KPI Row */}
        <section
          aria-label="Session statistics"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl bg-[#0F172A] border border-slate-800 p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>{m.label}</span>
                {m.icon}
              </div>
              <p className="font-display text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                {m.value}
              </p>
            </div>
          ))}
        </section>

        {/* Topics Studied & Recently Studied Subjects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-xl bg-[#0F172A] border border-slate-800 p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-white">
              Topics Studied
            </h2>
            {topicsStudied.length === 0 ? (
              <div className="py-6 text-sm text-slate-400 space-y-3">
                <p>No topics studied yet in this session.</p>
                <button
                  type="button"
                  onClick={onStartChat}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Ask Your First Question
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {topicsStudied.map((topic, i) => {
                  const matchingEntry = sessionHistory.find(
                    (entry) => entry.topic === topic
                  );
                  return (
                    <li
                      key={`${topic}-${i}`}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {topic}
                        </p>
                        {matchingEntry && (
                          <p className="text-xs text-slate-400">
                            {matchingEntry.subject} <span aria-hidden="true">·</span>{' '}
                            {matchingEntry.learningMode}
                          </p>
                        )}
                      </div>
                      {matchingEntry && (
                        <button
                          type="button"
                          onClick={() =>
                            onJumpToTopic(matchingEntry.topic, matchingEntry.subject)
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>Practice</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl bg-[#0F172A] border border-slate-800 p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-white">
              Recently Studied Subjects
            </h2>
            {recentSubjects.length === 0 ? (
              <p className="py-6 text-sm text-slate-400">
                Subjects will appear here as soon as you ask questions across categories.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {recentSubjects.map((subj) => {
                  const count = sessionHistory.filter(
                    (item) => item.subject === subj
                  ).length;
                  return (
                    <li
                      key={subj}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-slate-100">{subj}</span>
                      <span className="font-mono tabular-nums text-xs text-slate-400">
                        {count} {count === 1 ? 'question' : 'questions'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Study Session History Table */}
        <section className="rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">
              Study Session History
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {sessionHistory.length} entries
            </span>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-400">
              Your chronological question and topic log will populate here as you learn.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 bg-[#0B1222]">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Topic</th>
                    <th className="px-5 py-3">Subject</th>
                    <th className="px-5 py-3">Level</th>
                    <th className="px-5 py-3">Question</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {sessionHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-800/35 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono tabular-nums text-xs text-slate-400 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-100 whitespace-nowrap">
                        {entry.topic}
                      </td>
                      <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                        {entry.subject}
                      </td>
                      <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                        {entry.learningMode}
                      </td>
                      <td className="px-5 py-3 text-slate-400 max-w-md truncate">
                        {entry.questionSnippet}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
