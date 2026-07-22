import React, { useState } from 'react';
import { Shield, Copy, Check, Terminal } from 'lucide-react';
import { HistoryItem } from '../types';

interface ChmodToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

export default function ChmodTool({ onSaveHistory }: ChmodToolProps) {
  const [permissions, setPermissions] = useState({
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    public: { read: true, write: false, execute: true },
  });
  const [copied, setCopied] = useState<boolean>(false);

  const toggle = (category: 'owner' | 'group' | 'public', type: 'read' | 'write' | 'execute') => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type],
      },
    }));
  };

  const calculateOctal = () => {
    const calc = (p: { read: boolean; write: boolean; execute: boolean }) =>
      (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
    return `${calc(permissions.owner)}${calc(permissions.group)}${calc(permissions.public)}`;
  };

  const calculateSymbolic = () => {
    const calc = (p: { read: boolean; write: boolean; execute: boolean }) =>
      `${p.read ? 'r' : '-'}${p.write ? 'w' : '-'}${p.execute ? 'x' : '-'}`;
    return `${calc(permissions.owner)}${calc(permissions.group)}${calc(permissions.public)}`;
  };

  const octal = calculateOctal();
  const symbolic = calculateSymbolic();
  const chmodCommand = `chmod ${octal} filename.sh`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Chmod Linux Permission Calculator
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Calculate numeric octal codes and symbolic notation for Linux file permissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['owner', 'group', 'public'] as const).map((cat) => (
          <div key={cat} className="bg-gray-50 dark:bg-zinc-850 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
              {cat} Permissions
            </h3>
            <div className="space-y-3">
              {(['read', 'write', 'execute'] as const).map((type) => (
                <label key={type} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 cursor-pointer">
                  <span className="text-xs font-semibold capitalize text-gray-700 dark:text-zinc-300">
                    {type} ({type === 'read' ? '4' : type === 'write' ? '2' : '1'})
                  </span>
                  <input
                    type="checkbox"
                    checked={permissions[cat][type]}
                    onChange={() => toggle(cat, type)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-red-500"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Output Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Octal Notation</span>
          <div className="text-2xl font-mono font-bold text-gray-900 dark:text-zinc-100">{octal}</div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Symbolic Notation</span>
          <div className="text-xl font-mono font-bold text-gray-900 dark:text-zinc-100">{symbolic}</div>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" />
              Command
            </span>
            <div className="text-xs font-mono font-bold text-emerald-300 mt-1">{chmodCommand}</div>
          </div>
          <button onClick={() => copyToClipboard(chmodCommand)} className="text-gray-400 hover:text-white">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
