import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, Check, Upload, Download, ArrowRightLeft, FileUp, FileDown, Info } from 'lucide-react';
import { HistoryItem } from '../types';

interface Base64UrlToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
  forceMode?: ModeType;
}

type ModeType = 'base64' | 'url';
type DirectionType = 'encode' | 'decode';

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToUtf8(bytes: Uint8Array): string | null {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(bytes);
  } catch (e) {
    return null; // Not valid UTF-8
  }
}

function checkIsBinary(bytes: Uint8Array): boolean {
  const len = Math.min(bytes.length, 1000);
  let controlChars = 0;
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    if (b === 0 || (b < 32 && b !== 9 && b !== 10 && b !== 13)) {
      controlChars++;
    }
  }
  return controlChars > 0;
}

function detectFileType(bytes: Uint8Array): { mime: string; ext: string } {
  if (bytes.length >= 4) {
    const b = bytes;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) {
      return { mime: 'image/png', ext: 'png' };
    }
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) {
      return { mime: 'image/jpeg', ext: 'jpg' };
    }
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) {
      return { mime: 'image/gif', ext: 'gif' };
    }
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
      return { mime: 'application/pdf', ext: 'pdf' };
    }
    if (b[0] === 0x50 && b[1] === 0x4B && b[2] === 0x03 && b[3] === 0x04) {
      return { mime: 'application/zip', ext: 'zip' };
    }
    if (b[0] === 0x7F && b[1] === 0x45 && b[2] === 0x4C && b[3] === 0x46) {
      return { mime: 'application/octet-stream', ext: 'bin' };
    }
  }
  return { mime: 'application/octet-stream', ext: 'bin' };
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function Base64UrlTool({ onSaveHistory, history, forceMode }: Base64UrlToolProps) {
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<ModeType>('base64');
  const activeSubTab = forceMode || internalActiveSubTab;
  
  // Keep tab state synchronized when forceMode changes
  useEffect(() => {
    if (forceMode) {
      setInternalActiveSubTab(forceMode);
    }
  }, [forceMode]);
  const [direction, setDirection] = useState<DirectionType>('encode');
  const [autoConvert, setAutoConvert] = useState<boolean>(true);
  
  // Base64 text states
  const [base64Input, setBase64Input] = useState<string>('');
  const [base64Output, setBase64Output] = useState<string>('');
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [base64Error, setBase64Error] = useState<string | null>(null);
  const [base64Copied, setBase64Copied] = useState<boolean>(false);

  // Base64 decoding states
  const [decodedData, setDecodedData] = useState<{
    bytes: Uint8Array;
    text: string | null;
    isBinary: boolean;
    mime: string;
    ext: string;
    size: number;
  } | null>(null);
  const [decodeTab, setDecodeTab] = useState<'text' | 'file'>('text');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Base64 encoding states for file output
  const [encodeTab, setEncodeTab] = useState<'text' | 'file'>('text');
  const [encodeFileName, setEncodeFileName] = useState<string>('encoded_base64.txt');
  const [encodeMimeType, setEncodeMimeType] = useState<string>('text/plain');

  // Base64 file states
  const [fileToProcess, setFileToProcess] = useState<File | null>(null);
  const [fileOutputName, setFileOutputName] = useState<string>('decoded_output.bin');
  const [fileMimeType, setFileMimeType] = useState<string>('application/octet-stream');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL encoder/decoder states
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlOutput, setUrlOutput] = useState<string>('');
  const [urlMode, setUrlMode] = useState<'component' | 'full'>('component'); // encodeURIComponent vs encodeURI
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState<boolean>(false);

  useEffect(() => {
    if (decodedData && decodedData.isBinary && decodedData.mime.startsWith('image/')) {
      try {
        const blob = new Blob([decodedData.bytes], { type: decodedData.mime });
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        setImageUrl(null);
      }
    } else {
      setImageUrl(null);
    }
  }, [decodedData]);

  // Base64 logic
  const handleBase64TextProcess = (dir: DirectionType, skipHistory = false) => {
    setBase64Error(null);
    if (!base64Input.trim()) {
      setBase64Output('');
      setDecodedData(null);
      return;
    }

    try {
      if (dir === 'encode') {
        let result = btoa(unescape(encodeURIComponent(base64Input))); // Handles unicode characters perfectly!
        if (urlSafe) {
          result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        setBase64Output(result);
        setDecodedData(null);
        if (!skipHistory) {
          onSaveHistory(base64Input, result, { tool: 'base64', direction: 'encode', urlSafe });
        }
      } else {
        let cleanedInput = base64Input.trim();
        if (urlSafe) {
          cleanedInput = cleanedInput.replace(/-/g, '+').replace(/_/g, '/');
          // Add padding if missing
          while (cleanedInput.length % 4) {
            cleanedInput += '=';
          }
        }
        
        const bytes = base64ToBytes(cleanedInput);
        const utf8Text = bytesToUtf8(bytes);
        const isBinary = utf8Text === null || checkIsBinary(bytes);
        const { mime, ext } = detectFileType(bytes);

        const state = {
          bytes,
          text: utf8Text,
          isBinary,
          mime,
          ext,
          size: bytes.length
        };

        setDecodedData(state);

        if (isBinary) {
          setDecodeTab('file');
          setFileOutputName(`decoded_file.${ext}`);
          setFileMimeType(mime);
          setBase64Output('');
        } else {
          setDecodeTab('text');
          setBase64Output(utf8Text || '');
        }

        if (!skipHistory) {
          onSaveHistory(base64Input, isBinary ? `[Binary File: ${bytes.length} bytes]` : (utf8Text || ''), { 
            tool: 'base64', 
            direction: 'decode', 
            urlSafe,
            isBinary 
          });
        }
      }
    } catch (err: any) {
      setBase64Error(`Decoding error: Invalid base64 character sequence. Note: standard/url-safe mismatch could cause this.`);
      setDecodedData(null);
    }
  };

  // Base64 file processing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFileToProcess(files[0]);
    }
  };

  const encodeUploadedFile = () => {
    if (!fileToProcess) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Get base64 segment from data URL
      let base64Segment = dataUrl.split(',')[1] || dataUrl;
      if (urlSafe) {
        base64Segment = base64Segment.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      setBase64Output(base64Segment);
      setDecodedData(null);
      onSaveHistory(`[File: ${fileToProcess.name}]`, base64Segment, { tool: 'base64_file', direction: 'encode', urlSafe });
    };
    reader.onerror = () => {
      setBase64Error('Failed to read file');
    };
    reader.readAsDataURL(fileToProcess);
  };

  const decodeToFile = () => {
    setBase64Error(null);
    const bytesToUse = decodedData?.bytes;
    if (!bytesToUse) {
      setBase64Error('Please decode a valid base64 string first');
      return;
    }

    try {
      const blob = new Blob([bytesToUse], { type: fileMimeType });

      // Create download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileOutputName || 'decoded_file.bin';
      a.click();
      URL.revokeObjectURL(url);
      onSaveHistory(base64Input, `[Downloaded File: ${fileOutputName}]`, { tool: 'base64_file', direction: 'decode', urlSafe });
    } catch (err: any) {
      setBase64Error(`Failed to generate download file.`);
    }
  };

  const encodeToFile = () => {
    setBase64Error(null);
    if (!base64Output) {
      setBase64Error('Please encode some data or a file first');
      return;
    }

    try {
      const blob = new Blob([base64Output], { type: encodeMimeType });

      // Create download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = encodeFileName || 'encoded_base64.txt';
      a.click();
      URL.revokeObjectURL(url);
      onSaveHistory(
        base64Input || (fileToProcess ? `[File: ${fileToProcess.name}]` : ''), 
        `[Downloaded File: ${encodeFileName}]`, 
        { tool: 'base64_file', direction: 'encode', urlSafe }
      );
    } catch (err: any) {
      setBase64Error(`Failed to generate download file.`);
    }
  };

  // URL encoding logic
  const handleUrlProcess = (dir: DirectionType, skipHistory = false) => {
    setUrlError(null);
    if (!urlInput.trim()) {
      setUrlOutput('');
      return;
    }

    try {
      if (dir === 'encode') {
        const result = urlMode === 'component' ? encodeURIComponent(urlInput) : encodeURI(urlInput);
        setUrlOutput(result);
        if (!skipHistory) {
          onSaveHistory(urlInput, result, { tool: 'url', direction: 'encode', mode: urlMode });
        }
      } else {
        const result = urlMode === 'component' ? decodeURIComponent(urlInput) : decodeURI(urlInput);
        setUrlOutput(result);
        if (!skipHistory) {
          onSaveHistory(urlInput, result, { tool: 'url', direction: 'decode', mode: urlMode });
        }
      }
    } catch (err: any) {
      setUrlError('URL decoding error: Malformed URI sequence');
    }
  };

  // Trigger base64 auto-conversion
  useEffect(() => {
    if (autoConvert && activeSubTab === 'base64') {
      handleBase64TextProcess(direction, true);
    }
  }, [base64Input, direction, urlSafe, autoConvert, activeSubTab]);

  // Trigger URL auto-conversion
  useEffect(() => {
    if (autoConvert && activeSubTab === 'url') {
      handleUrlProcess(direction, true);
    }
  }, [urlInput, direction, urlMode, autoConvert, activeSubTab]);

  return (
    <div className="space-y-6" id="transcoder-tool-container">
      {/* Header and Sub tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="transcoder-title">
            {activeSubTab === 'base64' ? 'Base64 Encoder / Decoder' : 'URL Encoder / Decoder'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {activeSubTab === 'base64'
              ? 'Encode or decode Base64 strings, files, or images securely offline.'
              : 'Encode or decode URI characters, query parameters, and components.'}
          </p>
        </div>
        {!forceMode && (
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl" id="transcoder-subtabs">
            <button
              onClick={() => setInternalActiveSubTab('base64')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'base64'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
              }`}
            >
              Base64 Transcoder
            </button>
            <button
              onClick={() => setInternalActiveSubTab('url')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'url'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
              }`}
            >
              URL Encoder
            </button>
          </div>
        )}
      </div>

      {activeSubTab === 'base64' ? (
        <div className="space-y-6">
          {/* Base64 settings row */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urlSafe}
                  onChange={(e) => setUrlSafe(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">URL-Safe (Base64URL)</span>
              </label>
              <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800" />
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoConvert}
                  onChange={(e) => setAutoConvert(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Auto Convert</span>
              </label>
              <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800" />
              <div className="flex gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-gray-200 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setDirection('encode');
                    setBase64Output('');
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    direction === 'encode' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Encode
                </button>
                <button
                  onClick={() => {
                    setDirection('decode');
                    setBase64Output('');
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    direction === 'decode' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Decode
                </button>
              </div>
            </div>

            {/* File selector when encoding */}
            {direction === 'encode' && (
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
                >
                  <FileUp className="w-3.5 h-3.5 text-gray-400" />
                  {fileToProcess ? fileToProcess.name : 'Choose File to Encode'}
                </button>
                {fileToProcess && (
                  <button
                    onClick={encodeUploadedFile}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Process File
                  </button>
                )}
              </div>
            )}

            {/* Output configuration note when decoding */}
            {direction === 'decode' && (
              <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                Inputted Base64 is automatically analyzed to detect text vs. binary file formats.
              </p>
            )}
          </div>

          {/* Input & Output Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                {direction === 'encode' ? 'Input Text' : 'Base64 Input'}
              </span>
              <textarea
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                placeholder={direction === 'encode' ? 'Type or paste plaintext here...' : 'Paste your Base64 string here...'}
                className="w-full min-h-[250px] lg:min-h-[350px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
              />
              <button
                onClick={() => handleBase64TextProcess(direction)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded-xl transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                {direction === 'encode' ? 'Encode Text to Base64' : 'Decode Base64 Data'}
              </button>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between min-h-8">
                {direction === 'encode' ? (
                  <>
                    <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                      <button
                        onClick={() => setEncodeTab('text')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          encodeTab === 'text'
                            ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                            : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        Text Output
                      </button>
                      <button
                        onClick={() => setEncodeTab('file')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          encodeTab === 'file'
                            ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                            : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        File Output
                      </button>
                    </div>

                    {encodeTab === 'text' && base64Output && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(base64Output);
                          setBase64Copied(true);
                          setTimeout(() => setBase64Copied(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-all"
                      >
                        {base64Copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {base64Copied ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                      <button
                        onClick={() => setDecodeTab('text')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          decodeTab === 'text'
                            ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                            : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        Text Output
                      </button>
                      <button
                        onClick={() => setDecodeTab('file')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all relative ${
                          decodeTab === 'file'
                            ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                            : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        File Output
                        {decodedData?.isBinary && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </button>
                    </div>

                    {decodeTab === 'text' && base64Output && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(base64Output);
                          setBase64Copied(true);
                          setTimeout(() => setBase64Copied(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-all"
                      >
                        {base64Copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {base64Copied ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {direction === 'encode' ? (
                encodeTab === 'text' ? (
                  <pre className="w-full min-h-[250px] lg:min-h-[350px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-auto font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none">
                    {base64Output || (
                      <span className="text-gray-400 dark:text-zinc-600 italic">
                        Encoded output will appear here...
                      </span>
                    )}
                  </pre>
                ) : (
                  <div className="w-full min-h-[250px] lg:min-h-[350px] p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col justify-between">
                    {base64Output ? (
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-2">
                            <FileDown className="w-4 h-4 text-amber-500" />
                            <span>Encoded Output File Info</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs">
                            <div>
                              <span className="text-gray-400 block mb-0.5">File Size</span>
                              <span className="font-mono font-semibold text-gray-800 dark:text-zinc-200">
                                {formatBytes(base64Output.length)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 block mb-0.5">Format</span>
                              <span className="font-semibold text-gray-800 dark:text-zinc-200 uppercase">
                                Text (Base64)
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                Download Filename
                              </label>
                              <input
                                type="text"
                                value={encodeFileName}
                                onChange={(e) => setEncodeFileName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                MIME Type
                              </label>
                              <input
                                type="text"
                                value={encodeMimeType}
                                onChange={(e) => setEncodeMimeType(e.target.value)}
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={encodeToFile}
                          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download Encoded File
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-zinc-600 italic text-xs">
                        <span>No processed data. Provide input text or file and process it.</span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Decoding Mode Output Pane */
                decodeTab === 'text' ? (
                  <pre className="w-full min-h-[250px] lg:min-h-[350px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-auto font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none">
                    {decodedData?.isBinary ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-full text-amber-500">
                          <Info className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100">
                            Binary Data Detected
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                            This decoded data contains non-printable binary characters (size: {formatBytes(decodedData.size)}). Rendering binary data inside a text box is inappropriate and may cause lag or display unreadable symbols.
                          </p>
                        </div>
                        <button
                          onClick={() => setDecodeTab('file')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          <FileDown className="w-4 h-4" />
                          Switch to File Output
                        </button>
                      </div>
                    ) : (
                      base64Output || (
                        <span className="text-gray-400 dark:text-zinc-600 italic">
                          Plaintext output will appear here...
                        </span>
                      )
                    )}
                  </pre>
                ) : (
                  <div className="w-full min-h-[250px] lg:min-h-[350px] p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col justify-between">
                    {decodedData ? (
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-2">
                            <FileDown className="w-4 h-4 text-amber-500" />
                            <span>Decoded Binary File Info</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-xs">
                            <div>
                              <span className="text-gray-400 block mb-0.5">File Size</span>
                              <span className="font-mono font-semibold text-gray-800 dark:text-zinc-200">
                                {formatBytes(decodedData.size)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 block mb-0.5">Detected Type</span>
                              <span className="font-semibold text-gray-800 dark:text-zinc-200 uppercase">
                                {decodedData.ext}
                              </span>
                            </div>
                          </div>

                          {imageUrl && (
                            <div className="flex flex-col items-center justify-center border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl max-h-40 overflow-hidden">
                              <span className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Image Preview</span>
                              <img 
                                src={imageUrl} 
                                alt="Decoded base64 preview" 
                                className="max-h-24 object-contain rounded-lg shadow-sm" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                Download Filename
                              </label>
                              <input
                                type="text"
                                value={fileOutputName}
                                onChange={(e) => setFileOutputName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                MIME Type
                              </label>
                              <input
                                type="text"
                                value={fileMimeType}
                                onChange={(e) => setFileMimeType(e.target.value)}
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={decodeToFile}
                          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download File
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-zinc-600 italic text-xs">
                        <span>No processed data. Provide a Base64 string and process it.</span>
                      </div>
                    )}
                  </div>
                )
              )}

              <div className="h-10">
                {base64Error && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-mono">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{base64Error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* URL Mode selections */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="urlMode"
                  checked={urlMode === 'component'}
                  onChange={() => setUrlMode('component')}
                  className="text-amber-500 focus:ring-amber-500 bg-white dark:bg-zinc-900 w-4 h-4"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">encodeURIComponent (Standard query params)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="urlMode"
                  checked={urlMode === 'full'}
                  onChange={() => setUrlMode('full')}
                  className="text-amber-500 focus:ring-amber-500 bg-white dark:bg-zinc-900 w-4 h-4"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">encodeURI (Full URL with slashes intact)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800 hidden md:block" />
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoConvert}
                  onChange={(e) => setAutoConvert(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-4 h-4"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Auto Convert</span>
              </label>
            </div>
          </div>

          {/* URL Input & Output Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                URL Input / Raw String
              </span>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Type or paste query params, whole URLs, or special strings to encode/decode..."
                className="w-full min-h-[250px] lg:min-h-[350px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleUrlProcess('encode')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded-xl transition-colors"
                >
                  URL Encode
                </button>
                <button
                  onClick={() => handleUrlProcess('decode')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 dark:hover:bg-zinc-600 text-white font-medium text-sm rounded-xl transition-colors"
                >
                  URL Decode
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Transcoded Output
                </span>
                {urlOutput && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(urlOutput);
                      setUrlCopied(true);
                      setTimeout(() => setUrlCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-all"
                  >
                    {urlCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {urlCopied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <pre className="w-full min-h-[250px] lg:min-h-[350px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-auto font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none">
                {urlOutput || (
                  <span className="text-gray-400 dark:text-zinc-600 italic">
                    Output will appear here...
                  </span>
                )}
              </pre>
              <div className="h-10">
                {urlError && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-mono">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{urlError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
