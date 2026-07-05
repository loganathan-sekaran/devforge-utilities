import React, { useState, useEffect } from 'react';
import { Play, Check, Info, Search, ShieldCheck } from 'lucide-react';
import { HistoryItem } from '../types';

interface RegexToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

interface RegexMatch {
  text: string;
  index: number;
  groups: string[];
}

export default function RegexTool({ onSaveHistory, history }: RegexToolProps) {
  const [pattern, setPattern] = useState<string>('(\\w+)\\s(\\d+)');
  const [testString, setTestString] = useState<string>('Hello 2026, this is some test text from July 4th.');
  
  // Modifiers
  const [globalFlag, setGlobalFlag] = useState<boolean>(true);
  const [caseFlag, setCaseFlag] = useState<boolean>(true);
  const [multiFlag, setMultiFlag] = useState<boolean>(false);
  const [dotAllFlag, setDotAllFlag] = useState<boolean>(false);

  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setHighlightedHtml(testString);
      setError(null);
      return;
    }

    try {
      // Build flags string
      let flags = '';
      if (globalFlag) flags += 'g';
      if (caseFlag) flags += 'i';
      if (multiFlag) flags += 'm';
      if (dotAllFlag) flags += 's';

      const regex = new RegExp(pattern, flags);
      setError(null);

      // Perform matching
      const foundMatches: RegexMatch[] = [];
      let tempHtml = '';

      if (globalFlag) {
        let match;
        let lastIndex = 0;
        const safeLimit = 1000; // Prevent infinite loops
        let iterations = 0;

        while ((match = regex.exec(testString)) !== null && iterations < safeLimit) {
          iterations++;
          
          // Append preceding unmatched segment
          tempHtml += escapeHtml(testString.substring(lastIndex, match.index));
          // Append matched highlighted segment
          tempHtml += `<mark class="bg-amber-100 dark:bg-amber-950/60 border-b border-amber-400 dark:border-amber-500 text-amber-900 dark:text-amber-200 px-0.5 rounded-xs font-semibold select-all">${escapeHtml(match[0])}</mark>`;
          
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });

          lastIndex = regex.lastIndex;

          // Handle zero-width matches to avoid infinite loop
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
        // Append remaining string
        tempHtml += escapeHtml(testString.substring(lastIndex));
      } else {
        const match = regex.exec(testString);
        if (match) {
          tempHtml += escapeHtml(testString.substring(0, match.index));
          tempHtml += `<mark class="bg-amber-100 dark:bg-amber-950/60 border-b border-amber-400 dark:border-amber-500 text-amber-900 dark:text-amber-200 px-0.5 rounded-xs font-semibold select-all">${escapeHtml(match[0])}</mark>`;
          tempHtml += escapeHtml(testString.substring(match.index + match[0].length));

          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        } else {
          tempHtml = escapeHtml(testString);
        }
      }

      setMatches(foundMatches);
      setHighlightedHtml(tempHtml);

      // Save to history
      if (pattern && testString) {
        onSaveHistory(pattern, JSON.stringify({ matchesCount: foundMatches.length }), { tool: 'regex', testString });
      }
    } catch (err: any) {
      setMatches([]);
      setHighlightedHtml(escapeHtml(testString));
      setError(err.message || 'Invalid Regular Expression');
    }
  }, [pattern, testString, globalFlag, caseFlag, multiFlag, dotAllFlag]);

  // Helper to safely escape characters for rendering inside matching highlights
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const handleInsertPlaceholder = (patt: string) => {
    setPattern(patt);
  };

  return (
    <div className="space-y-6" id="regex-tool-container">
      {/* Title */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="regex-title">
          Regex Pattern Validator
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Build, test, and validate PCRE/Javascript regular expressions against custom test strings with real-time feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls and Input Pane (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Pattern builder */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Regex Pattern
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400 dark:text-zinc-600 font-mono font-bold select-none text-sm">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Type regex pattern... e.g., ([a-z]+)"
                className="w-full pl-7 pr-20 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                id="regex-pattern-input"
              />
              <span className="absolute right-4 text-gray-400 dark:text-zinc-600 font-mono font-bold select-none text-sm">
                /{globalFlag ? 'g' : ''}{caseFlag ? 'i' : ''}{multiFlag ? 'm' : ''}{dotAllFlag ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Flags row */}
          <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={globalFlag}
                onChange={(e) => setGlobalFlag(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Global (g)</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={caseFlag}
                onChange={(e) => setCaseFlag(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Insensitive (i)</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={multiFlag}
                onChange={(e) => setMultiFlag(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Multiline (m)</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dotAllFlag}
                onChange={(e) => setDotAllFlag(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">DotAll (s)</span>
            </label>
          </div>

          {/* Quick presets helper */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-gray-400">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleInsertPlaceholder('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')}
                className="px-2 py-1 bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-zinc-400 transition-colors"
              >
                Email Validator
              </button>
              <button
                onClick={() => handleInsertPlaceholder('^(https?:\\/\\/)?(www\\.)?[a-zA-Z0-9-]+(\\.[a-zA-Z]{2,})+(\\S*)?$')}
                className="px-2 py-1 bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-zinc-400 transition-colors"
              >
                URL Link
              </button>
              <button
                onClick={() => handleInsertPlaceholder('^\\d{4}-\\d{2}-\\d{2}$')}
                className="px-2 py-1 bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-zinc-400 transition-colors"
              >
                Date (YYYY-MM-DD)
              </button>
              <button
                onClick={() => handleInsertPlaceholder('^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$')}
                className="px-2 py-1 bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-zinc-400 transition-colors"
              >
                Hex Color
              </button>
            </div>
          </div>

          {/* Test input Area */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Test String
            </label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste test paragraph to match patterns against..."
              className="w-full min-h-[160px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
            />
          </div>

          {error && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-mono">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Visual Highlighter and matches (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Highlighter representation */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Match Highlighter
            </span>
            <div className="w-full min-h-[160px] max-h-[220px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-auto font-mono text-sm text-gray-800 dark:text-zinc-100 break-words whitespace-pre-wrap leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: highlightedHtml || testString }} />
            </div>
          </div>

          {/* Matches List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Matches ({matches.length})
              </span>
              {matches.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-bold">
                  Success
                </span>
              )}
            </div>

            <div className="w-full h-[220px] border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-auto bg-gray-50/50 dark:bg-zinc-950/20">
              {matches.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {matches.map((m, i) => (
                    <div key={i} className="p-3 font-mono text-xs hover:bg-gray-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                        <span className="font-bold">MATCH {i + 1}</span>
                        <span>Index: {m.index}</span>
                      </div>
                      <div className="text-gray-800 dark:text-zinc-200 font-semibold truncate bg-amber-500/5 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10">
                        {m.text}
                      </div>
                      {m.groups.length > 0 && (
                        <div className="mt-2 pl-2 border-l border-amber-300 dark:border-amber-800 space-y-1">
                          {m.groups.map((grp, idx) => (
                            <div key={idx} className="text-[10px] text-gray-500 dark:text-zinc-400">
                              Group {idx + 1}: <span className="font-semibold text-gray-700 dark:text-zinc-300">"{grp}"</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400 dark:text-zinc-500 text-xs italic">
                  No match highlights found. Modify the regex pattern or modifiers.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
