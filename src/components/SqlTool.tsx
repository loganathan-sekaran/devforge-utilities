import React, { useState } from 'react';
import { Database, Copy, Check, Sparkles } from 'lucide-react';
import { HistoryItem } from '../types';

interface SqlToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

export default function SqlTool({ onSaveHistory }: SqlToolProps) {
  const [inputSql, setInputSql] = useState<string>(
    `SELECT u.id, u.name, count(o.id) as total_orders FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' GROUP BY u.id HAVING total_orders > 5 ORDER BY u.created_at DESC;`
  );
  const [uppercaseKeywords, setUppercaseKeywords] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSql = (sql: string, uppercase: boolean) => {
    if (!sql.trim()) return '';

    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'INNER JOIN', 'OUTER JOIN', 'ON', 'GROUP BY', 'HAVING', 'ORDER BY',
      'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'
    ];

    let formatted = sql;

    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, uppercase ? kw : kw.toLowerCase());
    });

    // Insert linebreaks before major keywords
    const majorKeywords = ['SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'];
    majorKeywords.forEach(kw => {
      const target = uppercase ? kw : kw.toLowerCase();
      const regex = new RegExp(`\\s+(${target})\\b`, 'g');
      formatted = formatted.replace(regex, `\n$1`);
    });

    return formatted.trim();
  };

  const formattedOutput = formatSql(inputSql, uppercaseKeywords);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-500" />
            Client-Side SQL Query Formatter
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Beautify, indent, and format SQL queries locally inside your browser.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
            Raw SQL Query
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercaseKeywords}
              onChange={(e) => setUppercaseKeywords(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span>UPPERCASE Keywords</span>
          </label>
        </div>

        <textarea
          rows={6}
          value={inputSql}
          onChange={(e) => setInputSql(e.target.value)}
          className="w-full p-4 font-mono text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
          placeholder="SELECT * FROM table..."
        />

        {/* Formatted Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Formatted SQL Result
            </span>
            <button
              onClick={() => copyToClipboard(formattedOutput)}
              className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Formatted SQL</span>
            </button>
          </div>

          <pre className="p-4 font-mono text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-amber-400 overflow-x-auto min-h-[160px]">
            {formattedOutput}
          </pre>
        </div>
      </div>
    </div>
  );
}
