import React, { useState, useRef } from 'react';
import { Eye, Edit, FileText, FileUp, Copy, Check, Trash, RefreshCw, BookOpen, AlertCircle, Columns, Rows } from 'lucide-react';
import { HistoryItem } from '../types';
import Markdown from 'react-markdown';

interface MarkdownToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

export default function MarkdownTool({ onSaveHistory, history }: MarkdownToolProps) {
  const [markdown, setMarkdown] = useState<string>(
    `# 🚀 DevForge Markdown Previewer\n\nWelcome to the offline-secure Markdown editor and live HTML renderer!\n\n## Core Features\n- **Real-time Rendering**: See edits instantly on the right side panel.\n- **File Upload & Export**: Open \`.md\` files or download your edited content.\n- **Zero Server Overhead**: Rendered 100% locally inside your sandbox.\n\n## Typical Syntax Examples\n\n### Formatting\nThis is **bold** text, *italicized* text, and ~~strikethrough~~ text.\n\n### Code Blocks\n\`\`\`javascript\n// Copy-paste syntax highlighter code snippet\nfunction calculateChecksum(payload) {\n  console.log("Processing hash payload: " + payload);\n  return true;\n}\n\`\`\`\n\n### Tables\n| Option | Description | Status |\n| :--- | :--- | :--- |\n| Base64 | Transcoding binary files | Active |\n| REST Client | Client request executor | Active |\n| PEM Parser | Private key decoding | Active |\n\n### Blockquotes\n> Privacy first: This utility does not upload or transmit any text or document details back to servers.`
  );

  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [splitOrientation, setSplitOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setMarkdown(text);
        onSaveHistory(`Loaded MD file: ${file.name}`, `Size: ${text.length} chars`, { tool: 'markdown_preview', fileName: file.name });
      };
      reader.readAsText(file);
    }
  };

  const handleExportFile = () => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'devforge_document.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="markdown-tool-container">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="markdown-title">
            Markdown (MD) File Previewer
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Write, preview, and format standard GitHub Flavored Markdown files with instant live rendering.
          </p>
        </div>

        {/* View mode toggle controls */}
        <div className="flex items-center gap-3 shrink-0">
          {viewMode === 'split' && (
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl items-center gap-0.5">
              <button
                onClick={() => setSplitOrientation('vertical')}
                title="Vertical Split (Side-by-Side)"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  splitOrientation === 'vertical'
                    ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSplitOrientation('horizontal')}
                title="Horizontal Split (Stacked)"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  splitOrientation === 'horizontal'
                    ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Split View
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
              }`}
            >
              <Edit className="w-3.5 h-3.5" />
              Editor Only
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Only
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar actions */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between pb-1.5">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".md,.markdown,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors text-xs font-semibold shadow-2xs"
          >
            <FileUp className="w-3.5 h-3.5" />
            Open .md File
          </button>
          <button
            onClick={handleExportFile}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors text-xs font-semibold shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Document
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-semibold"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Raw Markdown'}
          </button>
          <button
            onClick={() => setMarkdown('')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 text-xs font-semibold"
          >
            <Trash className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Workspace Panels */}
      <div className={
        viewMode === 'split'
          ? splitOrientation === 'vertical'
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[450px]'
            : 'flex flex-col gap-6 min-h-[450px]'
          : 'grid grid-cols-1 gap-6 min-h-[450px]'
      }>
        {/* Editor Box */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className="flex flex-col space-y-2 flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Markdown Syntax Editor
            </span>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Start typing your markdown here..."
              className={`w-full p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y transition-all ${
                viewMode === 'split' && splitOrientation === 'horizontal' ? 'min-h-[220px]' : 'min-h-[400px] flex-1'
              }`}
            />
          </div>
        )}

        {/* Live Preview Box */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`flex flex-col space-y-2 flex-1 ${viewMode === 'preview' ? 'w-full' : ''}`}>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Rich Text Rendered HTML Preview
            </span>
            <div className={`w-full p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-auto select-text ${
              viewMode === 'split' && splitOrientation === 'horizontal' ? 'min-h-[250px]' : 'min-h-[400px] flex-1'
            }`}>
              <div className="markdown-body prose dark:prose-invert max-w-none text-xs text-gray-800 dark:text-zinc-200 leading-relaxed space-y-4">
                <Markdown>{markdown || '*Document is empty. Enter markdown to preview...*'}</Markdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
