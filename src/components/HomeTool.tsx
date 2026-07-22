import React, { useState } from 'react';
import {
  Braces,
  Binary,
  Link,
  FileCode,
  Award,
  Search,
  BookOpen,
  Hash,
  Layers,
  Columns,
  Globe,
  ArrowRight,
  ShieldCheck,
  SearchCode,
  Database,
  Shield,
  Clock,
  Calendar,
  Palette,
  Terminal
} from 'lucide-react';
import { ToolType } from '../types';

interface HomeToolProps {
  onSelectTool: (id: ToolType) => void;
  onSelectCategory: (catId: string) => void;
}

const categories = [
  { id: 'formatters', name: 'Data Formatters', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'encoders', name: 'Encoders & Decoders', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'security', name: 'Security & Crypto', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'text', name: 'Text Utils', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'network', name: 'Network & API', color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' }
];

const tools = [
  { id: 'json', name: 'JSON Formatter', desc: 'Beautify or minify JSON payloads, parse structure, and validate syntax.', icon: Braces, category: 'formatters' },
  { id: 'sql', name: 'SQL Formatter', desc: 'Beautify and minify SQL queries, format syntax for readability.', icon: Database, category: 'formatters' },
  { id: 'base64', name: 'Base64 Encoder/Decoder', desc: 'Encode or decode Base64 data & files, handling text and binary data.', icon: Binary, category: 'encoders' },
  { id: 'url', name: 'URL Encoder/Decoder', desc: 'Encode or decode URL parameters offline for safe data transfer.', icon: Link, category: 'encoders' },
  { id: 'escaper', name: 'HTML & String Escaper', desc: 'Escape or unescape HTML entities and JS strings safely.', icon: Binary, category: 'encoders' },
  { id: 'jwt', name: 'JWT Viewer', desc: 'Decode token claims offline to inspect payloads, headers, and signatures.', icon: FileCode, category: 'security' },
  { id: 'pem', name: 'PEM Key & Cert Decoder', desc: 'Decode and inspect PEM keys, CSRs, and X.509 certificates.', icon: Award, category: 'security' },
  { id: 'hash', name: 'Hash Generator', desc: 'Generate secure MD5, SHA-256, and SHA-512 cryptographic checks.', icon: Hash, category: 'security' },
  { id: 'chmod', name: 'Chmod Calculator', desc: 'Linux file permissions octal & symbolic parser and calculator.', icon: Shield, category: 'security' },
  { id: 'timestamp', name: 'Unix Timestamp & Epoch', desc: 'Live UTC clock, epoch timestamp converter, and timezone translator.', icon: Clock, category: 'text' },
  { id: 'cron', name: 'Cron Parser & Explainer', desc: 'Decode cron expressions into human-readable schedules with next-run schedules.', icon: Calendar, category: 'text' },
  { id: 'regex', name: 'Regex Validator', desc: 'Verify regular expressions with PCRE pattern highlighting and testing.', icon: Search, category: 'text' },
  { id: 'markdown', name: 'MD File Previewer', desc: 'Live render markdown documents to see rich text representation.', icon: BookOpen, category: 'text' },
  { id: 'uuid', name: 'UUID Generator', desc: 'Bulk generate cryptographically secure v4 UUIDs.', icon: Layers, category: 'text' },
  { id: 'diff', name: 'Diff Checker', desc: 'Compare side-by-side lines of text to check for diffs and changes.', icon: Columns, category: 'text' },
  { id: 'color', name: 'Color & Contrast Checker', desc: 'Convert colors and analyze WCAG contrast ratio for accessibility.', icon: Palette, category: 'text' },
  { id: 'rest', name: 'REST Client & Curl Generator', desc: 'Visual HTTP and Curl executor to test API requests and responses.', icon: Globe, category: 'network' },
  { id: 'curl', name: 'cURL to Code Converter', desc: 'Convert cURL commands to JavaScript, Python, Go, or Rust code snippets.', icon: Terminal, category: 'network' },
] as const;

export default function HomeTool({ onSelectTool, onSelectCategory }: HomeToolProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toolsByCategory = (catId: string) => {
    return filteredTools.filter((tool) => tool.category === catId);
  };

  return (
    <div className="space-y-12 animate-fade-in" id="home-tool-container">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600/10 via-indigo-600/5 to-transparent border border-gray-100/50 dark:border-zinc-800/40 p-8 lg:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Client-Side Sandbox
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Developer Utilities, <span className="text-blue-500 font-semibold">Reforged.</span>
          </h1>
          <p className="text-base text-gray-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            A comprehensive, high-performance toolkit designed for developers. Format payloads, encode keys, parse tokens, and execute network requests securely. All operations execute directly in your browser.
          </p>
        </div>

        {/* Embedded Interactive Search */}
        <div className="mt-8 max-w-lg relative">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchCode className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search utility tools (e.g. JWT, JSON, UUID)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
              id="home-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tools Grouped by Categories */}
      <div className="space-y-10">
        {categories.map((category) => {
          const categoryTools = toolsByCategory(category.id);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4" id={`category-section-${category.id}`}>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-850 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md border ${category.color}`}>
                    {category.name}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
                    {categoryTools.length} {categoryTools.length === 1 ? 'tool' : 'tools'}
                  </span>
                </div>
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className="text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline transition-all"
                >
                  View in sidebar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => onSelectTool(tool.id)}
                      className="group cursor-pointer p-6 rounded-2xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 hover:bg-gray-50/50 dark:hover:bg-zinc-900/80 hover:border-blue-500/50 dark:hover:border-blue-500/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-[180px] relative overflow-hidden"
                      id={`home-tool-card-${tool.id}`}
                    >
                      {/* Subtle hover background highlight */}
                      <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 group-hover:text-blue-500 group-hover:border-blue-500/20 group-hover:bg-blue-500/10 transition-all duration-300">
                            <ToolIcon className="w-5 h-5" />
                          </div>
                          <h3 className="font-semibold text-base text-gray-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">
                            {tool.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                          {tool.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 dark:text-blue-400 mt-4 group-hover:translate-x-1 transition-transform duration-300">
                        Launch Utility
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTools.length === 0 && (
          <div className="text-center py-16 bg-gray-50 dark:bg-zinc-900/20 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              No developer utilities match your query "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline"
            >
              Reset search query
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
