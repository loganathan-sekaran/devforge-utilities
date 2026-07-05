import React, { useState, useEffect, useRef } from 'react';
import { Play, Copy, Check, Info, FileText, RefreshCw } from 'lucide-react';
import { HistoryItem, BackgroundJob } from '../types';
import CryptoJS from 'crypto-js';

interface HashToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
  onAddJob: (job: BackgroundJob) => void;
  onUpdateJobProgress: (id: string, progress: number, status: 'running' | 'completed' | 'failed', result?: any, error?: string) => void;
}

export default function HashTool({ onSaveHistory, history, onAddJob, onUpdateJobProgress }: HashToolProps) {
  const [text, setText] = useState<string>('');
  const [hashes, setHashes] = useState({
    md5: '',
    sha256: '',
    sha512: '',
  });
  const [copied, setCopied] = useState<string | null>(null);

  // File states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileHashResult, setFileHashResult] = useState<{
    md5: string;
    sha256: string;
    sha512: string;
  } | null>(null);

  // Calculate string hashes in real-time
  useEffect(() => {
    if (!text) {
      setHashes({ md5: '', sha256: '', sha512: '' });
      return;
    }

    try {
      const md5 = CryptoJS.MD5(text).toString();
      const sha256 = CryptoJS.SHA256(text).toString();
      const sha512 = CryptoJS.SHA512(text).toString();

      setHashes({ md5, sha256, sha512 });

      // Save to history (debounced optionally, or just standard. We save it when the user stops typing or when they click, but let's record it)
    } catch (err) {
      console.error(err);
    }
  }, [text]);

  const handleCopy = (hashText: string, key: string) => {
    if (!hashText) return;
    navigator.clipboard.writeText(hashText);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setFileHashResult(null);
    }
  };

  // Heavy file hashing background job
  const startFileHashJob = () => {
    if (!selectedFile) return;

    const file = selectedFile;
    const jobId = Math.random().toString(36).substring(2, 9);
    const jobName = `Hash File: ${file.name}`;

    // Add to standard background jobs manager
    onAddJob({
      id: jobId,
      name: jobName,
      tool: 'hash',
      progress: 0,
      status: 'running',
      startedAt: Date.now(),
    });

    setFileHashResult(null);

    // Progressive hashing configuration
    const chunkSize = 2 * 1024 * 1024; // 2MB chunk size
    const totalSize = file.size;
    let offset = 0;

    // Create algorithmic progressive hashing objects
    const md5Algo = CryptoJS.algo.MD5.create();
    const sha256Algo = CryptoJS.algo.SHA256.create();
    const sha512Algo = CryptoJS.algo.SHA512.create();

    const reader = new FileReader();

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      if (!e.target || !e.target.result) {
        onUpdateJobProgress(jobId, 0, 'failed', null, 'Failed to read file chunk');
        return;
      }

      const buffer = e.target.result as ArrayBuffer;
      const wordArray = CryptoJS.lib.WordArray.create(buffer);

      // Feed into all 3 hashing algorithms
      md5Algo.update(wordArray);
      sha256Algo.update(wordArray);
      sha512Algo.update(wordArray);

      offset += buffer.byteLength;
      const progress = Math.round((offset / totalSize) * 100);

      // Update background job progress
      onUpdateJobProgress(jobId, progress, 'running');

      if (offset < totalSize) {
        // Yield to browser execution to keep UI smooth, then read next chunk
        setTimeout(readNextChunk, 1);
      } else {
        // Finished! Finalize hashes
        const md5 = md5Algo.finalize().toString();
        const sha256 = sha256Algo.finalize().toString();
        const sha512 = sha512Algo.finalize().toString();

        const results = { md5, sha256, sha512 };
        setFileHashResult(results);

        onUpdateJobProgress(jobId, 100, 'completed', results);
        onSaveHistory(`[File Hash] ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, sha256, {
          md5,
          sha256,
          sha512,
        });
      }
    };

    reader.onerror = () => {
      onUpdateJobProgress(jobId, 0, 'failed', null, 'File loading failed');
    };

    // Trigger first chunk load
    readNextChunk();
  };

  return (
    <div className="space-y-6" id="hash-tool-container">
      {/* Title */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="hash-title">
          Cryptographic Hash Generator
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Compute MD5, SHA-256, and SHA-512 hashes for text blocks or files of any size with progressive processing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Text Inputs and File Selection */}
        <div className="space-y-6">
          {/* Text Input Block */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Input Plaintext
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text to hash instantly..."
              className="w-full min-h-[140px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-100 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-3 text-gray-400 font-semibold tracking-wider">OR HASH A FILE</span>
            </div>
          </div>

          {/* File input and hashing */}
          <div className="p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/30 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                Select File
              </button>
              <div className="text-xs text-gray-500 dark:text-zinc-400 truncate flex-1">
                {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : 'No file selected (Supports large files)'}
              </div>
            </div>

            {selectedFile && (
              <button
                onClick={startFileHashJob}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                Compute File Hashes (Background Job)
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Generated Hash Fields */}
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Hash Values
          </span>

          {/* MD5 */}
          <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400">MD5 (128-bit)</span>
              {(hashes.md5 || (fileHashResult && fileHashResult.md5)) && (
                <button
                  onClick={() => handleCopy(fileHashResult ? fileHashResult.md5 : hashes.md5, 'md5')}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  {copied === 'md5' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'md5' ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="font-mono text-sm text-gray-800 dark:text-zinc-200 select-all break-all bg-gray-50 dark:bg-zinc-950 p-2 rounded-lg border border-gray-100 dark:border-zinc-850">
              {fileHashResult ? fileHashResult.md5 : (hashes.md5 || 'Wait for text input or select file...')}
            </div>
          </div>

          {/* SHA-256 */}
          <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400">SHA-256 (256-bit)</span>
              {(hashes.sha256 || (fileHashResult && fileHashResult.sha256)) && (
                <button
                  onClick={() => handleCopy(fileHashResult ? fileHashResult.sha256 : hashes.sha256, 'sha256')}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  {copied === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'sha256' ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="font-mono text-sm text-gray-800 dark:text-zinc-200 select-all break-all bg-gray-50 dark:bg-zinc-950 p-2 rounded-lg border border-gray-100 dark:border-zinc-850">
              {fileHashResult ? fileHashResult.sha256 : (hashes.sha256 || 'Wait for text input or select file...')}
            </div>
          </div>

          {/* SHA-512 */}
          <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400">SHA-512 (512-bit)</span>
              {(hashes.sha512 || (fileHashResult && fileHashResult.sha512)) && (
                <button
                  onClick={() => handleCopy(fileHashResult ? fileHashResult.sha512 : hashes.sha512, 'sha512')}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  {copied === 'sha512' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'sha512' ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="font-mono text-sm text-gray-800 dark:text-zinc-200 select-all break-all bg-gray-50 dark:bg-zinc-950 p-2 rounded-lg border border-gray-100 dark:border-zinc-850 max-h-[100px] overflow-auto">
              {fileHashResult ? fileHashResult.sha512 : (hashes.sha512 || 'Wait for text input or select file...')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
