import React, { useState } from 'react';
import { X, Search, Trash2, Copy, Check, Clock, Tag } from 'lucide-react';
import { HistoryItem } from '../types';

interface GlobalHistoryPanelProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLoadHistoryInput: (item: HistoryItem) => void;
}

export default function GlobalHistoryPanel({
  history,
  onClearHistory,
  onRemoveHistoryItem,
  isOpen,
  onClose,
  onLoadHistoryInput,
}: GlobalHistoryPanelProps) {
  const [search, setSearch] = useState<string>('');
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyInput = (item: HistoryItem) => {
    navigator.clipboard.writeText(item.input);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.input.toLowerCase().includes(search.toLowerCase()) ||
      item.output.toLowerCase().includes(search.toLowerCase()) ||
      (item.label && item.label.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilter = toolFilter === 'all' || item.tool === toolFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white dark:bg-zinc-950 shadow-2xl border-l border-gray-100 dark:border-zinc-850 z-50 flex flex-col transition-all duration-300" id="global-history-sidebar">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-100 dark:border-zinc-850 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Operations History
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">Quickly restore or copy previous inputs</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-gray-50 dark:border-zinc-900 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search within history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-zinc-500">Filter Tool:</span>
          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="text-xs bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-gray-600 dark:text-zinc-400 font-medium focus:outline-none"
          >
            <option value="all">All Utilities</option>
            <option value="json">JSON Formatter</option>
            <option value="base64">Base64 Transcoder</option>
            <option value="url">URL Encoder</option>
            <option value="jwt">JWT Viewer</option>
            <option value="regex">Regex Validator</option>
            <option value="hash">Hash Generator</option>
            <option value="uuid">UUID Generator</option>
            <option value="diff">Diff Checker</option>
          </select>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/10 hover:border-amber-500/20 transition-all flex flex-col gap-2 relative group"
            >
              {/* Top tag & time */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 font-semibold text-[9px] uppercase text-gray-500 dark:text-zinc-400">
                  <Tag className="w-2.5 h-2.5" />
                  {item.tool}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Input snippet preview */}
              <div className="font-mono text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 break-all bg-white dark:bg-zinc-950 p-2 rounded border border-gray-100 dark:border-zinc-850">
                {item.input}
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between gap-2 mt-1">
                <button
                  onClick={() => {
                    onLoadHistoryInput(item);
                    onClose();
                  }}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Apply Input
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyInput(item)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded transition-all"
                    title="Copy full input"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onRemoveHistoryItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-zinc-500 mt-20">
            <Clock className="w-10 h-10 mb-2 stroke-1" />
            <p className="text-sm font-medium">No activity items matched</p>
            <p className="text-xs max-w-xs mt-1">
              {history.length === 0 ? 'Your local operations logs will appear here as you run various tools.' : 'Try widening your filters or search keywords.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer controls */}
      {history.length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-zinc-950/50 flex gap-2">
          <button
            onClick={onClearHistory}
            className="w-full py-2.5 inline-flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Wipe Entire History
          </button>
        </div>
      )}
    </div>
  );
}
