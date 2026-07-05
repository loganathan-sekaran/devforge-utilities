import React, { useState, useEffect } from 'react';
import { Play, Copy, Check, Info, FileUp, ArrowRightLeft, Columns, List } from 'lucide-react';
import { HistoryItem } from '../types';
import * as Diff from 'diff';

interface DiffToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

export default function DiffTool({ onSaveHistory, history }: DiffToolProps) {
  const [original, setOriginal] = useState<string>('{\n  "name": "Developer Tools",\n  "version": "1.0.0",\n  "offline": false,\n  "tools": [\n    "JSON Formatter",\n    "Base64 Tool"\n  ]\n}');
  const [modified, setModified] = useState<string>('{\n  "name": "Developer Tools Suite",\n  "version": "1.1.0",\n  "offline": true,\n  "tools": [\n    "JSON Formatter",\n    "Base64 & URL Transcoder",\n    "Text Diff Checker"\n  ]\n}');

  const [diffParts, setDiffParts] = useState<Diff.Change[]>([]);
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('inline');
  const [stats, setStats] = useState({ additions: 0, deletions: 0 });

  const handleComputeDiff = () => {
    // We compute character diffs or word/line diffs. Line diffs are standard for code.
    const result = Diff.diffLines(original, modified);
    setDiffParts(result);

    let additions = 0;
    let deletions = 0;
    result.forEach((part) => {
      if (part.added) additions += part.count || 0;
      else if (part.removed) deletions += part.count || 0;
    });

    setStats({ additions, deletions });

    onSaveHistory(
      `Diff Check [Lines: ${original.split('\n').length} vs ${modified.split('\n').length}]`,
      `Additions: ${additions}, Deletions: ${deletions}`,
      { tool: 'diff', additions, deletions }
    );
  };

  useEffect(() => {
    handleComputeDiff();
  }, [original, modified]);

  return (
    <div className="space-y-6" id="diff-tool-container">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="diff-title">
            Text Diff Checker
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Compare two text segments line-by-line, highlighting additions and deletions.
          </p>
        </div>

        {/* View Layout Options */}
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setDiffMode('inline')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              diffMode === 'inline'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Inline
          </button>
          <button
            onClick={() => setDiffMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              diffMode === 'side-by-side'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side by Side
          </button>
        </div>
      </div>

      {/* Input Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Original Text
          </span>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Paste your original source string here..."
            className="w-full min-h-[160px] lg:min-h-[220px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y transition-all"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Modified Text
          </span>
          <textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            placeholder="Paste your modified source string here..."
            className="w-full min-h-[160px] lg:min-h-[220px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y transition-all"
          />
        </div>
      </div>

      {/* Statistics / Output Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Diff Comparison Result
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
              +{stats.additions} insertions
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-lg border border-red-100 dark:border-red-900/40">
              -{stats.deletions} deletions
            </span>
          </div>
        </div>

        {/* Diff Output Renderer */}
        {diffMode === 'inline' ? (
          <div className="w-full min-h-[180px] p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-auto font-mono text-xs leading-relaxed max-h-[450px]">
            {diffParts.map((part, index) => {
              const bgClass = part.added
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-l-4 border-emerald-500'
                : part.removed
                ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-l-4 border-red-500 line-through'
                : 'text-gray-700 dark:text-zinc-300';
              
              return (
                <div key={index} className={`px-2 py-0.5 whitespace-pre-wrap ${bgClass}`}>
                  {part.value}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column (Original/Removed) */}
            <div className="w-full min-h-[180px] p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-auto font-mono text-xs leading-relaxed max-h-[450px]">
              <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Original State</div>
              {diffParts.map((part, index) => {
                if (part.added) return null; // Skip added blocks for original view
                const bgClass = part.removed
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-l-4 border-red-500 line-through'
                  : 'text-gray-600 dark:text-zinc-400';
                
                return (
                  <div key={index} className={`px-2 py-0.5 whitespace-pre-wrap ${bgClass}`}>
                    {part.value}
                  </div>
                );
              })}
            </div>

            {/* Right Column (Modified/Added) */}
            <div className="w-full min-h-[180px] p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-auto font-mono text-xs leading-relaxed max-h-[450px]">
              <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Modified State</div>
              {diffParts.map((part, index) => {
                if (part.removed) return null; // Skip removed blocks for modified view
                const bgClass = part.added
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-l-4 border-emerald-500'
                  : 'text-gray-600 dark:text-zinc-400';
                
                return (
                  <div key={index} className={`px-2 py-0.5 whitespace-pre-wrap ${bgClass}`}>
                    {part.value}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
