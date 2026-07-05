import React, { useState, useEffect } from 'react';
import { Play, Copy, Check, Trash2, ArrowUpDown, FileDown, Info, RefreshCw } from 'lucide-react';
import { HistoryItem } from '../types';

interface JSONToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

export default function JSONTool({ onSaveHistory, history }: JSONToolProps) {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [indent, setIndent] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Validate JSON in real-time or on-demand
  const validateAndProcess = (minify: boolean) => {
    if (!input.trim()) {
      setError(null);
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      let result = '';
      if (minify) {
        result = JSON.stringify(parsed);
      } else {
        result = JSON.stringify(parsed, null, indent);
      }
      setOutput(result);
      setError(null);
      onSaveHistory(input, result, { action: minify ? 'minify' : 'format', indent });
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dev-tools-formatted-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.input);
    setOutput(item.output);
    setError(null);
  };

  return (
    <div className="space-y-6" id="json-tool-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="json-tool-title">
            JSON Formatter & Minifier
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Validate, clean, beautify, or compress your JSON payloads completely offline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Indentation:</label>
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            id="json-indent-select"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
            <option value={8}>8 Spaces</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Pane */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Input JSON
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors"
                id="json-clear-btn"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="relative flex-1 min-h-[300px] lg:min-h-[450px]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste your raw JSON string here... e.g., {"id":1,"name":"John Doe","active":true}'
              className="w-full h-full min-h-[300px] lg:min-h-[450px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
              id="json-input-textarea"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => validateAndProcess(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
              id="json-format-btn"
            >
              <Play className="w-4 h-4" />
              Beautify / Format
            </button>
            <button
              onClick={() => validateAndProcess(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 dark:hover:bg-zinc-600 text-white font-medium text-sm rounded-xl transition-colors"
              id="json-minify-btn"
            >
              <ArrowUpDown className="w-4 h-4" />
              Minify to Single Line
            </button>
          </div>
        </div>

        {/* Output Pane */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Output
            </span>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-all"
                    id="json-download-btn"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-all"
                    id="json-copy-btn"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="relative flex-1 min-h-[300px] lg:min-h-[450px]">
            <pre className="w-full h-full min-h-[300px] lg:min-h-[450px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-auto font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none">
              {output || (
                <span className="text-gray-400 dark:text-zinc-600 italic">
                  Formatted output will appear here after execution...
                </span>
              )}
            </pre>
          </div>
          <div className="h-[42px] flex items-center">
            {error && (
              <div className="w-full inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-mono">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History section for this tool specifically */}
      {history.length > 0 && (
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">
            Recent JSON Activity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="group p-3 rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-gray-50/50 dark:bg-zinc-900/20 hover:border-amber-500/50 dark:hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="font-mono text-xs text-gray-500 dark:text-zinc-400 truncate mb-2">
                  {item.input}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500">
                  <span>{item.metadata?.action === 'minify' ? 'Minified' : 'Formatted'}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
