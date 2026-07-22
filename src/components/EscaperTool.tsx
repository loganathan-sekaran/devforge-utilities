import React, { useState } from 'react';
import { Binary, Copy, Check } from 'lucide-react';
import { HistoryItem } from '../types';

interface EscaperToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

type Mode = 'html' | 'js' | 'url';

export default function EscaperTool({ onSaveHistory }: EscaperToolProps) {
  const [inputStr, setInputStr] = useState<string>(`<div class="card">Hello & Welcome! "DevForge"</div>`);
  const [mode, setMode] = useState<Mode>('html');
  const [action, setAction] = useState<'escape' | 'unescape'>('escape');
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processText = (text: string, currentMode: Mode, currentAction: 'escape' | 'unescape') => {
    if (!text) return '';

    if (currentMode === 'html') {
      if (currentAction === 'escape') {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      } else {
        return text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      }
    } else if (currentMode === 'url') {
      if (currentAction === 'escape') return encodeURIComponent(text);
      try {
        return decodeURIComponent(text);
      } catch {
        return 'Invalid URL encoded string';
      }
    } else {
      // JavaScript string escape
      if (currentAction === 'escape') {
        return JSON.stringify(text).slice(1, -1);
      } else {
        try {
          return JSON.parse(`"${text}"`);
        } catch {
          return text;
        }
      }
    }
  };

  const outputStr = processText(inputStr, mode, action);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Binary className="w-6 h-6 text-purple-500" />
            HTML, JavaScript & URL String Escaper / Unescaper
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Escape or unescape HTML entities, special JS characters, and percent-encoded URLs.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {(['html', 'js', 'url'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase rounded-lg border transition-all ${
                  mode === m
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700'
                }`}
              >
                {m === 'html' ? 'HTML Entities' : m === 'js' ? 'JS Strings' : 'URL Components'}
              </button>
            ))}
          </div>

          <div className="flex gap-2 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setAction('escape')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                action === 'escape' ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-300 shadow-xs' : 'text-gray-600 dark:text-zinc-400'
              }`}
            >
              Escape
            </button>
            <button
              onClick={() => setAction('unescape')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                action === 'unescape' ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-300 shadow-xs' : 'text-gray-600 dark:text-zinc-400'
              }`}
            >
              Unescape
            </button>
          </div>
        </div>

        {/* Input */}
        <textarea
          rows={5}
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          className="w-full p-4 font-mono text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          placeholder="Paste string here..."
        />

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
              Result Output
            </span>
            <button
              onClick={() => copyToClipboard(outputStr)}
              className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Output</span>
            </button>
          </div>

          <pre className="p-4 font-mono text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-purple-300 overflow-x-auto min-h-[120px]">
            {outputStr}
          </pre>
        </div>
      </div>
    </div>
  );
}
