import React, { useState } from 'react';
import { Calendar, Copy, Check, Clock } from 'lucide-react';
import { HistoryItem } from '../types';

interface CronToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

export default function CronTool({ onSaveHistory }: CronToolProps) {
  const [cronInput, setCronInput] = useState<string>('*/15 * * * *');
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseCronExpression = (expression: string) => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 6) {
      return { isValid: false, message: 'Cron expression must have 5 or 6 fields (minute, hour, day-of-month, month, day-of-week).' };
    }

    const [minute, hour, dom, month, dow] = parts;

    let explanation = 'Runs ';
    if (minute === '*' && hour === '*') explanation += 'every minute';
    else if (minute.startsWith('*/')) explanation += `every ${minute.replace('*/', '')} minutes`;
    else explanation += `at minute ${minute}`;

    if (hour !== '*') {
      if (hour.startsWith('*/')) explanation += `, every ${hour.replace('*/', '')} hours`;
      else explanation += `, at hour ${hour}:00`;
    }

    if (dom !== '*') explanation += `, on day-of-month ${dom}`;
    if (month !== '*') explanation += `, in month ${month}`;
    if (dow !== '*') explanation += `, on day-of-week ${dow}`;

    explanation += '.';

    return { isValid: true, message: explanation, parts: { minute, hour, dom, month, dow } };
  };

  const parsed = parseCronExpression(cronInput);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-500" />
            Cron Expression Parser & Explainer
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Parse standard 5-part cron schedules into human-readable text.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
            Cron Expression Syntax (Minute Hour Day-of-Month Month Day-of-Week)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cronInput}
              onChange={(e) => setCronInput(e.target.value)}
              placeholder="e.g. 0 9 * * 1-5"
              className="flex-1 px-4 py-2.5 font-mono text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(cronInput)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* Preset Cron Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { label: 'Every 5 mins', cron: '*/5 * * * *' },
            { label: 'Every Hour', cron: '0 * * * *' },
            { label: 'Every Day at Midnight', cron: '0 0 * * *' },
            { label: 'Every Monday 9 AM', cron: '0 9 * * 1' },
            { label: 'First day of Month', cron: '0 0 1 * *' },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => setCronInput(preset.cron)}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors"
            >
              {preset.label} ({preset.cron})
            </button>
          ))}
        </div>

        {/* Output Explanation Card */}
        <div className={`p-5 rounded-xl border ${parsed.isValid ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 text-gray-600 dark:text-zinc-400">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Human-Readable Explanation</span>
          </div>
          <div className={`text-base font-semibold ${parsed.isValid ? 'text-indigo-900 dark:text-indigo-200' : 'text-red-700 dark:text-red-400'}`}>
            {parsed.message}
          </div>
        </div>
      </div>
    </div>
  );
}
