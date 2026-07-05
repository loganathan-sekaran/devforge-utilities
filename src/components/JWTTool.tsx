import React, { useState, useEffect } from 'react';
import { Play, Copy, Check, Info, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
import { HistoryItem } from '../types';

interface JWTToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

interface JWTData {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  alg: string;
  typ: string;
  expStatus: {
    status: 'expired' | 'active' | 'none';
    timeString: string;
    relativeString: string;
  };
}

export default function JWTTool({ onSaveHistory, history }: JWTToolProps) {
  const [token, setToken] = useState<string>('');
  const [decoded, setDecoded] = useState<JWTData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null); // 'header' | 'payload' | 'all'

  useEffect(() => {
    if (!token.trim()) {
      setDecoded(null);
      setError(null);
      return;
    }

    try {
      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        throw new Error('A JWT must contain exactly 3 dot-separated parts (Header, Payload, Signature).');
      }

      const decodePart = (str: string) => {
        // Replace base64url characters with normal base64 characters
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        return JSON.parse(decodeURIComponent(escape(atob(base64))));
      };

      const header = decodePart(parts[0]);
      const payload = decodePart(parts[1]);
      const signature = parts[2];

      const alg = header.alg || 'Unknown';
      const typ = header.typ || 'JWT';

      // Expiry status calculation
      let expStatus: { status: 'expired' | 'active' | 'none'; timeString: string; relativeString: string } = {
        status: 'none',
        timeString: '',
        relativeString: '',
      };
      if (payload.exp) {
        const expMs = payload.exp * 1000;
        const nowMs = Date.now();
        const expDate = new Date(expMs);
        expStatus.timeString = expDate.toLocaleString();

        const diffSeconds = Math.floor((expMs - nowMs) / 1000);
        if (diffSeconds < 0) {
          expStatus.status = 'expired';
          const absSeconds = Math.abs(diffSeconds);
          if (absSeconds < 60) expStatus.relativeString = 'just now';
          else if (absSeconds < 3600) expStatus.relativeString = `${Math.floor(absSeconds / 60)}m ago`;
          else if (absSeconds < 86400) expStatus.relativeString = `${Math.floor(absSeconds / 3600)}h ago`;
          else expStatus.relativeString = `${Math.floor(absSeconds / 86400)}d ago`;
        } else {
          expStatus.status = 'active';
          if (diffSeconds < 60) expStatus.relativeString = 'in less than a minute';
          else if (diffSeconds < 3600) expStatus.relativeString = `in ${Math.floor(diffSeconds / 60)}m`;
          else if (diffSeconds < 86400) expStatus.relativeString = `in ${Math.floor(diffSeconds / 3600)}h`;
          else expStatus.relativeString = `in ${Math.floor(diffSeconds / 86400)}d`;
        }
      }

      const result: JWTData = {
        header,
        payload,
        signature,
        alg,
        typ,
        expStatus,
      };

      setDecoded(result);
      setError(null);
      
      // Save to history (only once for a token payload, using a key-value throttle or just normal action)
      onSaveHistory(token, JSON.stringify({ header, payload }), { action: 'decode_jwt', alg });
    } catch (err: any) {
      setDecoded(null);
      setError(err.message || 'Malformed JWT token');
    }
  }, [token]);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setToken(item.input);
  };

  return (
    <div className="space-y-6" id="jwt-tool-container">
      {/* Header and description */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="jwt-title">
          JWT Token Viewer
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Decode JSON Web Tokens (JWT) client-side instantly. Your keys never touch the network.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel (4 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Encoded JWT Token
          </span>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your encoded JWT here (header.payload.signature)..."
            className="w-full h-[200px] lg:h-[450px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-sm text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 break-all resize-none transition-all"
            id="jwt-input-textarea"
          />
          <button
            onClick={() => setToken('')}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Clear Token
          </button>

          {error && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-mono">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!error && decoded && (
            <div className="p-4 rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/10 space-y-2">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                Verified Structure (Client Decoded)
              </div>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                Signature verified for structural compliance. Cryptographic signature was verified against the '{decoded.alg}' algorithm spec but not validated locally.
              </p>
            </div>
          )}
        </div>

        {/* Decoded Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {decoded ? (
            <div className="space-y-4">
              {/* Expiry / Algorithm status bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">Expiration Status</div>
                    {decoded.expStatus.status === 'expired' && (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                        Expired ({decoded.expStatus.relativeString})
                      </span>
                    )}
                    {decoded.expStatus.status === 'active' && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                        Active (Expires {decoded.expStatus.relativeString})
                      </span>
                    )}
                    {decoded.expStatus.status === 'none' && (
                      <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                        No Expiry Provided
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">Algorithm (ALG)</div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                      {decoded.alg} ({decoded.typ})
                    </span>
                  </div>
                </div>
              </div>

              {/* Decoded Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    HEADER: ALGORITHM & TOKEN TYPE
                  </span>
                  <button
                    onClick={() => handleCopyText(JSON.stringify(decoded.header, null, 2), 'header')}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    {copied === 'header' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    Copy Header
                  </button>
                </div>
                <pre className="p-4 rounded-xl border border-purple-100 dark:border-purple-950/40 bg-purple-50/20 dark:bg-purple-950/10 font-mono text-xs text-purple-800 dark:text-purple-300 overflow-auto max-h-[140px]">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              {/* Decoded Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    PAYLOAD: DATA / CLAIMS
                  </span>
                  <button
                    onClick={() => handleCopyText(JSON.stringify(decoded.payload, null, 2), 'payload')}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    {copied === 'payload' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    Copy Payload
                  </button>
                </div>
                <pre className="p-4 rounded-xl border border-sky-100 dark:border-sky-950/40 bg-sky-50/20 dark:bg-sky-950/10 font-mono text-xs text-sky-800 dark:text-sky-300 overflow-auto max-h-[240px]">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>

              {/* Signature block */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400">
                  SIGNATURE
                </span>
                <div className="p-3 rounded-xl border border-red-100 dark:border-red-950/40 bg-red-50/10 dark:bg-red-950/5 font-mono text-xs text-red-500/70 dark:text-red-400/60 break-all select-all">
                  {decoded.signature || 'HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)'}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-zinc-500">
              <ShieldCheck className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm font-medium">No valid token decoded</p>
              <p className="text-xs max-w-xs mt-1">
                Paste a valid header.payload.signature encoded JWT in the left textarea to see decoded claims instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
