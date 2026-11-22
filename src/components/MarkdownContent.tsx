import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedBlock(code);
    setTimeout(() => setCopiedBlock(null), 1800);
  };

  return (
    <div className="prose prose-invert prose-slate max-w-none text-[15px] leading-[1.68] text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-xl font-semibold text-white mt-5 mb-2.5 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display text-lg font-semibold text-white mt-5 mb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display text-base font-semibold text-violet-200 mt-4 mb-1.5 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-slate-200">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1.5 text-slate-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-2 text-slate-200">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-lg border border-violet-500/25 bg-violet-950/25 px-4 py-3 text-slate-200">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || codeText.includes('\n');

            if (!isBlock) {
              return (
                <code
                  className="font-mono text-[13px] rounded bg-slate-800/90 px-1.5 py-0.5 text-violet-200 border border-slate-700/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-3 rounded-lg border border-slate-700/70 bg-[#060A14] overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
                  <span className="font-mono">{match ? match[1] : 'code'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(codeText)}
                    className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedBlock === codeText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed text-slate-100 font-mono">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-900/90 px-3.5 py-2.5 font-semibold text-slate-100 border-b border-slate-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-slate-300 border-b border-slate-800/70">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
