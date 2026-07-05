import React, { useState } from 'react';
import { Play, Copy, Check, FileDown, Layers, HelpCircle, Loader, Info } from 'lucide-react';
import { HistoryItem, BackgroundJob } from '../types';

interface UUIDToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
  onAddJob: (job: BackgroundJob) => void;
  onUpdateJobProgress: (id: string, progress: number, status: 'running' | 'completed' | 'failed', result?: any, error?: string) => void;
}

export default function UUIDTool({ onSaveHistory, history, onAddJob, onUpdateJobProgress }: UUIDToolProps) {
  const [count, setCount] = useState<number>(10);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hyphens, setHyphens] = useState<boolean>(true);
  const [wrapping, setWrapping] = useState<'none' | 'single' | 'double' | 'array'>('none');
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Fast client-side standard UUID v4 generator
  const generateUUIDv4 = (): string => {
    // Falls back to math.random if crypto is undefined, but modern browsers all have crypto.randomUUID
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    
    // Fallback v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const applyFormat = (uuidStr: string): string => {
    let result = uuidStr;
    if (!hyphens) {
      result = result.replace(/-/g, '');
    }
    if (uppercase) {
      result = result.toUpperCase();
    }
    return result;
  };

  const executeGeneration = () => {
    if (count <= 0) return;

    // If count is very large, generate in a background job
    if (count > 5000) {
      handleBulkGenerationJob();
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const list: string[] = [];
      for (let i = 0; i < count; i++) {
        list.push(applyFormat(generateUUIDv4()));
      }
      setUuids(list);
      setIsGenerating(false);

      // Save to history
      onSaveHistory(`Generate ${count} UUIDs`, list.slice(0, 3).join(', ') + (count > 3 ? '...' : ''), {
        count,
        uppercase,
        hyphens,
      });
    }, 50);
  };

  // Large bulk UUID background job
  const handleBulkGenerationJob = () => {
    const jobId = Math.random().toString(36).substring(2, 9);
    const jobName = `Generate ${count.toLocaleString()} UUIDs`;

    onAddJob({
      id: jobId,
      name: jobName,
      tool: 'uuid',
      progress: 0,
      status: 'running',
      startedAt: Date.now(),
    });

    setUuids([]);
    setIsGenerating(true);

    const generatedList: string[] = [];
    const batchSize = 5000;
    let currentCount = 0;

    const generateBatch = () => {
      const remaining = count - currentCount;
      const sizeToGenerate = Math.min(batchSize, remaining);

      for (let i = 0; i < sizeToGenerate; i++) {
        generatedList.push(applyFormat(generateUUIDv4()));
      }

      currentCount += sizeToGenerate;
      const progress = Math.round((currentCount / count) * 100);

      onUpdateJobProgress(jobId, progress, 'running');

      if (currentCount < count) {
        // Yield thread to remain fully responsive
        setTimeout(generateBatch, 1);
      } else {
        // Completed
        setUuids(generatedList);
        setIsGenerating(false);
        onUpdateJobProgress(jobId, 100, 'completed', generatedList);
        onSaveHistory(`Generated ${count.toLocaleString()} UUIDs`, `Bulk UUID list completed.`, { count });
      }
    };

    generateBatch();
  };

  // Wrap UUIDs for final rendering display
  const getFormattedOutput = (): string => {
    if (uuids.length === 0) return '';

    switch (wrapping) {
      case 'single':
        return uuids.map(u => `'${u}'`).join(',\n');
      case 'double':
        return uuids.map(u => `"${u}"`).join(',\n');
      case 'array':
        return JSON.stringify(uuids, null, 2);
      default:
        return uuids.join('\n');
    }
  };

  const handleCopy = () => {
    const text = getFormattedOutput();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = getFormattedOutput();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${uuids.length}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="uuid-tool-container">
      {/* Title */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="uuid-title">
          UUID Generator
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Generate structurally compliant RFC-4122 v4 UUIDs singly or in massive batches instantly without any network hops.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Pane (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Generator Configuration
          </span>

          {/* Count selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Quantity to Generate:
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={100000}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100000, Number(e.target.value))))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-semibold text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                id="uuid-count-input"
              />
              <div className="flex gap-1.5">
                {[1, 10, 100, 1000, 10000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setCount(v)}
                    className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                  >
                    {v >= 1000 ? `${v/1000}k` : v}
                  </button>
                ))}
              </div>
            </div>
            {count > 5000 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-600 dark:text-blue-400">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                Large counts ( &gt; 5,000) run as background progress jobs.
              </div>
            )}
          </div>

          {/* Toggle features */}
          <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/20 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hyphens}
                onChange={(e) => setHyphens(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-semibold text-gray-800 dark:text-zinc-200">Include Hyphens</div>
                <div className="text-gray-400 text-[10px]">e.g. f81d4fae-7dec-11d0-a765-00a0c91e6bf6</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-semibold text-gray-800 dark:text-zinc-200">Uppercase Letters</div>
                <div className="text-gray-400 text-[10px]">e.g. F81D4FAE-... vs f81d4fae-...</div>
              </div>
            </label>
          </div>

          {/* Output structure wrapper */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Wrapping / Output Formatting:
            </label>
            <select
              value={wrapping}
              onChange={(e: any) => setWrapping(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-semibold text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="none">Plaintext Line-by-line (Standard)</option>
              <option value="single">Single Quotes with Comma ( 'uuid', 'uuid' )</option>
              <option value="double">Double Quotes with Comma ( "uuid", "uuid" )</option>
              <option value="array">JSON Array [ "uuid", "uuid" ]</option>
            </select>
          </div>

          <button
            onClick={executeGeneration}
            disabled={isGenerating}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-gray-200 dark:disabled:bg-zinc-800 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            {isGenerating ? 'Generating...' : `Generate UUIDs`}
          </button>
        </div>

        {/* Output Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Generated UUIDs ({uuids.length})
            </span>
            {uuids.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-all"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy All'}
                </button>
              </div>
            )}
          </div>

          <div className="relative flex-1 min-h-[300px] lg:min-h-[400px]">
            <textarea
              readOnly
              value={getFormattedOutput()}
              placeholder="Your generated UUID list will be shown here..."
              className="w-full h-full min-h-[300px] lg:min-h-[400px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none resize-none overflow-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
