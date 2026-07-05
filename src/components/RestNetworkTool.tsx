import React, { useState, useEffect } from 'react';
import { Play, Copy, Check, Info, FileText, Send, Trash, Plus, AlertCircle, RefreshCw, Terminal, Sliders, Globe, Cookie, File } from 'lucide-react';
import { HistoryItem } from '../types';

interface RestNetworkToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

interface KeyValueRow {
  key: string;
  value: string;
  enabled: boolean;
  type?: 'text' | 'file';
  file?: File;
}

export default function RestNetworkTool({ onSaveHistory, history }: RestNetworkToolProps) {
  // Tabs: 'executor' | 'parser'
  const [activeTab, setActiveTab] = useState<'executor' | 'parser'>('executor');

  // Request sub-tab configurations: 'params' | 'headers' | 'body' | 'cookies'
  const [requestTab, setRequestTab] = useState<'params' | 'headers' | 'body' | 'cookies'>('params');

  // Network client states
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/posts/1');
  
  // Grid parameters states
  const [queryParams, setQueryParams] = useState<KeyValueRow[]>([]);
  const [cookies, setCookies] = useState<KeyValueRow[]>([]);
  const [headers, setHeaders] = useState<KeyValueRow[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true },
  ]);

  const [bodyType, setBodyType] = useState<'none' | 'json' | 'text' | 'form-urlencoded' | 'multipart-form'>('none');
  const [bodyContent, setBodyContent] = useState<string>('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  
  const [formUrlEncoded, setFormUrlEncoded] = useState<KeyValueRow[]>([
    { key: 'name', value: 'DevForge Tester', enabled: true },
  ]);
  const [multipartForm, setMultipartForm] = useState<KeyValueRow[]>([
    { key: 'description', value: 'API payload attachment', enabled: true, type: 'text' },
  ]);

  // Real-time generated curl output
  const [generatedCurl, setGeneratedCurl] = useState<string>('');

  // Execution states
  const [loading, setLoading] = useState<boolean>(false);
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [resStatusText, setResStatusText] = useState<string>('');
  const [resTime, setResTime] = useState<number | null>(null);
  const [resSize, setResSize] = useState<string | null>(null);
  const [resHeaders, setResHeaders] = useState<{ [key: string]: string }>({});
  const [resBody, setResBody] = useState<string>('');
  const [resError, setResError] = useState<string | null>(null);

  // Copied alerts
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedResBody, setCopiedResBody] = useState<boolean>(false);

  // Pasted Curl Parser State
  const [pastedCurl, setPastedCurl] = useState<string>('');
  const [parserError, setParserError] = useState<string | null>(null);
  const [parserSuccess, setParserSuccess] = useState<boolean>(false);

  // Preset templates
  const presets = [
    {
      name: 'GET - JSONPlaceholder Post',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      bodyType: 'none' as const,
      bodyContent: '',
      headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
    },
    {
      name: 'POST - JSONPlaceholder Create',
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'POST',
      bodyType: 'json' as const,
      bodyContent: '{\n  "title": "DevForge API Testing",\n  "body": "This request was sent from the browser client.",\n  "userId": 42\n}',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Accept', value: 'application/json', enabled: true }
      ],
    },
    {
      name: 'GET - CoinGecko Ping',
      url: 'https://api.coingecko.com/api/v3/ping',
      method: 'GET',
      bodyType: 'none' as const,
      bodyContent: '',
      headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
    },
  ];

  // Bidirectional synchronisation between URL string and Query Params Grid
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    try {
      const qIndex = newUrl.indexOf('?');
      if (qIndex !== -1) {
        const qStr = newUrl.substring(qIndex + 1);
        const searchParams = new URLSearchParams(qStr);
        const paramsList: KeyValueRow[] = [];
        searchParams.forEach((value, key) => {
          paramsList.push({ key, value, enabled: true });
        });
        setQueryParams(paramsList);
      } else {
        setQueryParams([]);
      }
    } catch {
      // ignore parsing bounds on broken inputs
    }
  };

  const updateUrlFromQueryParams = (params: KeyValueRow[]) => {
    let baseUrl = url;
    const qIndex = url.indexOf('?');
    if (qIndex !== -1) {
      baseUrl = url.substring(0, qIndex);
    }
    const activeParams = params.filter(p => p.enabled && p.key.trim() !== '');
    if (activeParams.length > 0) {
      const searchParams = new URLSearchParams();
      activeParams.forEach(p => {
        searchParams.append(p.key, p.value);
      });
      setUrl(`${baseUrl}?${searchParams.toString()}`);
    } else {
      setUrl(baseUrl);
    }
  };

  // Generate Curl command on configuration change
  useEffect(() => {
    let curl = `curl -X ${method} "${url}"`;
    
    // Append enabled headers
    headers.forEach((h) => {
      if (h.enabled && h.key.trim()) {
        const val = h.value.replace(/"/g, '\\"');
        curl += ` \\\n  -H "${h.key}: ${val}"`;
      }
    });

    // Append cookies as Cookie header or -b flag
    const activeCookies = cookies.filter(c => c.enabled && c.key.trim());
    if (activeCookies.length > 0) {
      const cookieStr = activeCookies.map(c => `${c.key}=${c.value}`).join('; ');
      curl += ` \\\n  -b "${cookieStr}"`;
    }

    // Append body details
    if (bodyType === 'json' || bodyType === 'text') {
      if (bodyContent.trim()) {
        const escapedBody = bodyContent.replace(/"/g, '\\"').replace(/\n/g, ' ');
        curl += ` \\\n  -d "${escapedBody}"`;
      }
    } else if (bodyType === 'form-urlencoded') {
      const formParams = formUrlEncoded.filter(r => r.enabled && r.key.trim());
      if (formParams.length > 0) {
        const bodyStr = formParams.map(r => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value)}`).join('&');
        curl += ` \\\n  -H "Content-Type: application/x-www-form-urlencoded" \\\n  -d "${bodyStr}"`;
      }
    } else if (bodyType === 'multipart-form') {
      const formParams = multipartForm.filter(r => r.enabled && r.key.trim());
      if (formParams.length > 0) {
        formParams.forEach(r => {
          if (r.type === 'file' && r.file) {
            curl += ` \\\n  -F "${r.key}=@${r.file.name}"`;
          } else {
            curl += ` \\\n  -F "${r.key}=${r.value}"`;
          }
        });
      }
    }

    setGeneratedCurl(curl);
  }, [method, url, headers, cookies, bodyType, bodyContent, formUrlEncoded, multipartForm]);

  // Execute Request
  const handleExecute = async () => {
    setLoading(true);
    setResStatus(null);
    setResStatusText('');
    setResTime(null);
    setResSize(null);
    setResHeaders({});
    setResBody('');
    setResError(null);

    const startTime = performance.now();

    try {
      const reqHeaders: Record<string, string> = {};
      
      // Add custom headers
      headers.forEach((h) => {
        if (h.enabled && h.key.trim()) {
          reqHeaders[h.key.trim()] = h.value;
        }
      });

      // Add custom cookies
      const activeCookies = cookies.filter(c => c.enabled && c.key.trim());
      if (activeCookies.length > 0) {
        reqHeaders['Cookie'] = activeCookies.map(c => `${c.key}=${c.value}`).join('; ');
      }

      const options: RequestInit = {
        method,
        headers: reqHeaders,
      };

      // Set body payloads
      if (method !== 'GET' && method !== 'HEAD') {
        if (bodyType === 'json' || bodyType === 'text') {
          options.body = bodyContent;
        } else if (bodyType === 'form-urlencoded') {
          const params = new URLSearchParams();
          formUrlEncoded.forEach(r => {
            if (r.enabled && r.key.trim()) {
              params.append(r.key.trim(), r.value);
            }
          });
          options.body = params.toString();
          if (!reqHeaders['Content-Type']) {
            reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
          }
        } else if (bodyType === 'multipart-form') {
          const formData = new FormData();
          multipartForm.forEach(r => {
            if (r.enabled && r.key.trim()) {
              if (r.type === 'file' && r.file) {
                formData.append(r.key.trim(), r.file);
              } else {
                formData.append(r.key.trim(), r.value);
              }
            }
          });
          options.body = formData;
          // Delete Content-Type to let browser attach the multipart boundary automatically
          delete reqHeaders['Content-Type'];
        }
      }

      const response = await fetch(url, options);
      const endTime = performance.now();
      setResTime(Math.round(endTime - startTime));
      setResStatus(response.status);
      setResStatusText(response.statusText);

      // Extract Headers
      const heads: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        heads[key] = val;
      });
      setResHeaders(heads);

      // Read text body
      const text = await response.text();
      setResBody(text);

      // Size calculation
      const bytes = new Blob([text]).size;
      setResSize(formatBytes(bytes));

      onSaveHistory(
        `${method} ${url}`,
        `Status ${response.status} (${formatBytes(bytes)})`,
        { tool: 'rest_executor', method, url, status: response.status }
      );
    } catch (err: any) {
      const endTime = performance.now();
      setResTime(Math.round(endTime - startTime));
      setResError(
        err.message || 
        'Request failed. This is likely due to a network connection issue, invalid URL protocol, or a CORS block on the remote server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Parsing pasted curl command
  const handleParseCurl = () => {
    setParserError(null);
    setParserSuccess(false);

    if (!pastedCurl.trim()) {
      setParserError('Please paste a curl command to parse');
      return;
    }

    try {
      const cmd = pastedCurl.replace(/\\\r?\n/g, ' ').trim();
      
      let parsedMethod = 'GET';
      let parsedUrl = '';
      const parsedHeaders: KeyValueRow[] = [];
      let parsedBody = '';
      let parsedBodyType: typeof bodyType = 'none';

      // Method match
      const methodMatch = cmd.match(/(?:-X|--request)\s+([A-Za-z]+)/i) || cmd.match(/(?:-X)([A-Za-z]+)/i);
      if (methodMatch) {
        parsedMethod = methodMatch[1].toUpperCase();
      }

      // Headers match
      const headerRegex = /(?:-H|--header)\s+("(.*?)"|'(.*?)'|([^\s'"]+))/g;
      let headerMatch;
      while ((headerMatch = headerRegex.exec(cmd)) !== null) {
        const headerStr = headerMatch[2] || headerMatch[3] || headerMatch[4];
        if (headerStr && headerStr.includes(':')) {
          const parts = headerStr.split(':');
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          parsedHeaders.push({ key, value, enabled: true });
        }
      }

      // Body match
      const bodyRegex = /(?:-d|--data|--data-raw|--data-binary)\s+("(.*?)"|'(.*?)'|([^\s'"]+))/g;
      const bodyMatch = bodyRegex.exec(cmd);
      if (bodyMatch) {
        parsedBody = bodyMatch[2] || bodyMatch[3] || bodyMatch[4] || '';
        parsedBody = parsedBody.replace(/\\"/g, '"').replace(/\\n/g, '\n');
        if (parsedMethod === 'GET') parsedMethod = 'POST';
        
        parsedBodyType = 'text';
        try {
          JSON.parse(parsedBody);
          parsedBodyType = 'json';
          parsedBody = JSON.stringify(JSON.parse(parsedBody), null, 2);
        } catch {
          // not JSON, keep as text
        }
      }

      // URL discovery
      const words: string[] = [];
      let currentWord = '';
      let inQuotes = false;
      let quoteChar = '';

      for (let i = 0; i < cmd.length; i++) {
        const char = cmd[i];
        if ((char === '"' || char === "'") && (i === 0 || cmd[i - 1] !== '\\')) {
          if (inQuotes && char === quoteChar) {
            inQuotes = false;
          } else if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          }
        } else if (char === ' ' && !inQuotes) {
          if (currentWord) {
            words.push(currentWord);
            currentWord = '';
          }
        } else {
          currentWord += char;
        }
      }
      if (currentWord) words.push(currentWord);

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (w === 'curl' || w.startsWith('-')) {
          if (['-X', '--request', '-H', '--header', '-d', '--data', '--data-raw', '--data-binary'].includes(w)) {
            i++;
          }
          continue;
        }
        if (w.startsWith('http://') || w.startsWith('https://') || w.includes('.') || w.includes('localhost')) {
          parsedUrl = w.replace(/^["']|["']$/g, '');
          break;
        }
      }

      if (!parsedUrl) {
        for (let i = 1; i < words.length; i++) {
          const w = words[i];
          if (w.startsWith('-')) {
            if (['-X', '--request', '-H', '--header', '-d', '--data', '--data-raw', '--data-binary', '-m', '--max-time', '-u', '--user'].includes(w)) {
              i++;
            }
            continue;
          }
          parsedUrl = w.replace(/^["']|["']$/g, '');
          break;
        }
      }

      if (!parsedUrl) {
        throw new Error('Could not identify request URL inside the curl command');
      }

      setMethod(parsedMethod);
      setUrl(parsedUrl);
      setHeaders(parsedHeaders.length ? parsedHeaders : [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Accept', value: 'application/json', enabled: true }
      ]);
      setBodyType(parsedBodyType);
      if (parsedBody) {
        setBodyContent(parsedBody);
      }

      // Automatically sync parameters parsed from URL
      const qIndex = parsedUrl.indexOf('?');
      if (qIndex !== -1) {
        const searchParams = new URLSearchParams(parsedUrl.substring(qIndex + 1));
        const paramsList: KeyValueRow[] = [];
        searchParams.forEach((value, key) => {
          paramsList.push({ key, value, enabled: true });
        });
        setQueryParams(paramsList);
      } else {
        setQueryParams([]);
      }

      setParserSuccess(true);
      setActiveTab('executor');
      setTimeout(() => setParserSuccess(false), 3000);
    } catch (err: any) {
      setParserError(err.message || 'Failed to parse curl command. Make sure it has a valid curl syntax.');
    }
  };

  const handlePresetSelect = (p: typeof presets[0]) => {
    setMethod(p.method);
    handleUrlChange(p.url);
    setBodyType(p.bodyType);
    setBodyContent(p.bodyContent);
    setHeaders(p.headers.map(h => ({ ...h })));
    setCookies([]);
  };

  // Grid rows state managers
  const addHeaderRow = () => setHeaders([...headers, { key: '', value: '', enabled: true }]);
  const updateHeaderRow = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: val };
    setHeaders(updated);
  };
  const deleteHeaderRow = (index: number) => setHeaders(headers.filter((_, i) => i !== index));

  const addQueryParamRow = () => {
    const updated = [...queryParams, { key: '', value: '', enabled: true }];
    setQueryParams(updated);
    updateUrlFromQueryParams(updated);
  };
  const updateQueryParamRow = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...queryParams];
    updated[index] = { ...updated[index], [field]: val };
    setQueryParams(updated);
    updateUrlFromQueryParams(updated);
  };
  const deleteQueryParamRow = (index: number) => {
    const updated = queryParams.filter((_, i) => i !== index);
    setQueryParams(updated);
    updateUrlFromQueryParams(updated);
  };

  const addCookieRow = () => setCookies([...cookies, { key: '', value: '', enabled: true }]);
  const updateCookieRow = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...cookies];
    updated[index] = { ...updated[index], [field]: val };
    setCookies(updated);
  };
  const deleteCookieRow = (index: number) => setCookies(cookies.filter((_, i) => i !== index));

  const addFormUrlEncodedRow = () => setFormUrlEncoded([...formUrlEncoded, { key: '', value: '', enabled: true }]);
  const updateFormUrlEncodedRow = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...formUrlEncoded];
    updated[index] = { ...updated[index], [field]: val };
    setFormUrlEncoded(updated);
  };
  const deleteFormUrlEncodedRow = (index: number) => setFormUrlEncoded(formUrlEncoded.filter((_, i) => i !== index));

  const addMultipartFormRow = () => setMultipartForm([...multipartForm, { key: '', value: '', enabled: true, type: 'text' }]);
  const updateMultipartFormRow = (index: number, field: string, val: any) => {
    const updated = [...multipartForm];
    updated[index] = { ...updated[index], [field]: val };
    setMultipartForm(updated);
  };
  const deleteMultipartFormRow = (index: number) => setMultipartForm(multipartForm.filter((_, i) => i !== index));

  const copyToClipboard = (text: string, flagSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    flagSetter(true);
    setTimeout(() => flagSetter(false), 2000);
  };

  const getFormattedResponseBody = (): string => {
    if (!resBody) return '';
    try {
      const parsed = JSON.parse(resBody);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return resBody;
    }
  };

  // Extract cookies from responses (often limited due to CORS)
  const parseResponseCookies = () => {
    const list: { key: string; value: string; domain?: string; path?: string; expires?: string }[] = [];
    const setCookieHeader = Object.entries(resHeaders).find(([k]) => k.toLowerCase() === 'set-cookie');
    if (setCookieHeader) {
      const value = setCookieHeader[1];
      const parts = value.split(';');
      const firstPart = parts[0];
      const eqIndex = firstPart.indexOf('=');
      if (eqIndex !== -1) {
        const key = firstPart.substring(0, eqIndex).trim();
        const val = firstPart.substring(eqIndex + 1).trim();
        
        let domain = '';
        let path = '';
        let expires = '';
        
        parts.slice(1).forEach(p => {
          const trimmed = p.trim().toLowerCase();
          if (trimmed.startsWith('domain=')) domain = p.split('=')[1];
          else if (trimmed.startsWith('path=')) path = p.split('=')[1];
          else if (trimmed.startsWith('expires=')) expires = p.split('=')[1];
        });
        
        list.push({ key, value: val, domain, path, expires });
      }
    }
    return list;
  };

  return (
    <div className="space-y-6" id="rest-tool-container">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="rest-title">
            Network & REST API Tool
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Visually construct HTTP headers, cookies, query parameters, multipart forms and send requests locally.
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('executor')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'executor'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
            }`}
          >
            REST & Curl Visual Generator
          </button>
          <button
            onClick={() => setActiveTab('parser')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'parser'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
            }`}
          >
            Import pasted Curl
          </button>
        </div>
      </div>

      {activeTab === 'parser' ? (
        /* Curl Parser Tab */
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
            <Terminal className="w-4 h-4 text-amber-500" />
            <span>Paste your cURL Command</span>
          </div>

          <div className="relative">
            <textarea
              value={pastedCurl}
              onChange={(e) => setPastedCurl(e.target.value)}
              placeholder="curl -X POST https://api.example.com/data -H 'Content-Type: application/json' -d '{&quot;id&quot;: 123}'"
              className="w-full min-h-[160px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
            />
          </div>

          {parserError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parserError}</span>
            </div>
          )}

          {parserSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <Check className="w-4 h-4 shrink-0" />
              <span>Curl command parsed and loaded into visual executor successfully!</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleParseCurl}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
            >
              <Sliders className="w-4 h-4" />
              Parse & Load into Visual Executor
            </button>
            <button
              onClick={() => setPastedCurl('')}
              className="px-4 py-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors text-sm font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        /* Visual Request Builder & Executor Tab */
        <div className="space-y-6">
          {/* Quick presets row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400 font-semibold tracking-wide uppercase mr-1">Load Preset:</span>
            {presets.map((p, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(p)}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-md font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Hand: Request Parameters */}
            <div className="lg:col-span-7 space-y-6 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-850 pb-6 lg:pb-0 lg:pr-6">
              
              {/* Method & URL Input row */}
              <div className="flex gap-2.5">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl font-bold text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                  <option value="HEAD">HEAD</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl font-mono text-sm text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <button
                  onClick={handleExecute}
                  disabled={loading || !url.trim()}
                  className="px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>

              {/* Nested Configuration sub-tabs bar */}
              <div className="flex border-b border-gray-200 dark:border-zinc-800 text-xs font-semibold pb-1 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestTab('params')}
                  className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                    requestTab === 'params'
                      ? 'border-amber-500 text-amber-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-850 dark:text-zinc-400'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Params {queryParams.filter(p => p.enabled && p.key).length > 0 && `(${queryParams.filter(p => p.enabled && p.key).length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setRequestTab('headers')}
                  className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                    requestTab === 'headers'
                      ? 'border-amber-500 text-amber-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-850 dark:text-zinc-400'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Headers ({headers.filter(h => h.enabled && h.key).length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestTab('body')}
                  className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                    requestTab === 'body'
                      ? 'border-amber-500 text-amber-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-850 dark:text-zinc-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Body {bodyType !== 'none' && `(${bodyType === 'multipart-form' ? 'multipart' : bodyType === 'form-urlencoded' ? 'urlencoded' : bodyType})`}
                </button>
                <button
                  type="button"
                  onClick={() => setRequestTab('cookies')}
                  className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                    requestTab === 'cookies'
                      ? 'border-amber-500 text-amber-500 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-850 dark:text-zinc-400'
                  }`}
                >
                  <Cookie className="w-3.5 h-3.5" />
                  Cookies {cookies.filter(c => c.enabled && c.key).length > 0 && `(${cookies.filter(c => c.enabled && c.key).length})`}
                </button>
              </div>

              {/* Sub-tab Panes */}
              <div className="min-h-[160px]">
                {/* 1. Query Parameters Tab */}
                {requestTab === 'params' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        Query Parameters (Appended to URL)
                      </span>
                      <button
                        type="button"
                        onClick={addQueryParamRow}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 uppercase cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Row
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
                      {queryParams.map((q, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={q.enabled}
                            onChange={(e) => updateQueryParamRow(index, 'enabled', e.target.checked)}
                            className="rounded border-gray-300 text-amber-500 focus:ring-amber-500/20 h-4 w-4 shrink-0"
                          />
                          <input
                            type="text"
                            value={q.key}
                            onChange={(e) => updateQueryParamRow(index, 'key', e.target.value)}
                            placeholder="param_key"
                            className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none"
                          />
                          <span className="text-gray-400 text-xs">=</span>
                          <input
                            type="text"
                            value={q.value}
                            onChange={(e) => updateQueryParamRow(index, 'value', e.target.value)}
                            placeholder="value"
                            className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => deleteQueryParamRow(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg shrink-0 cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {queryParams.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-zinc-600 italic text-center py-4">
                          No query parameters configured. Add a row above or append a `?query=param` to the URL field.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Headers Tab */}
                {requestTab === 'headers' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        HTTP Headers
                      </span>
                      <button
                        type="button"
                        onClick={addHeaderRow}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 uppercase cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Row
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
                      {headers.map((h, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={h.enabled}
                            onChange={(e) => updateHeaderRow(index, 'enabled', e.target.checked)}
                            className="rounded border-gray-300 text-amber-500 focus:ring-amber-500/20 h-4 w-4 shrink-0"
                          />
                          <input
                            type="text"
                            value={h.key}
                            onChange={(e) => updateHeaderRow(index, 'key', e.target.value)}
                            placeholder="Header-Key"
                            className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none"
                          />
                          <span className="text-gray-400 text-xs">:</span>
                          <input
                            type="text"
                            value={h.value}
                            onChange={(e) => updateHeaderRow(index, 'value', e.target.value)}
                            placeholder="Header-Value"
                            className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => deleteHeaderRow(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg shrink-0 cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {headers.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-zinc-600 italic text-center py-4">
                          No headers added. Click &apos;Add Row&apos; above.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Cookies Tab */}
                {requestTab === 'cookies' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        Request Cookies (Injected into Cookie header)
                      </span>
                      <button
                        type="button"
                        onClick={addCookieRow}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 uppercase cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Cookie
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
                      {cookies.map((c, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={c.enabled}
                            onChange={(e) => updateCookieRow(index, 'enabled', e.target.checked)}
                            className="rounded border-gray-300 text-amber-500 h-4 w-4 shrink-0"
                          />
                          <input
                            type="text"
                            value={c.key}
                            onChange={(e) => updateCookieRow(index, 'key', e.target.value)}
                            placeholder="cookie_name"
                            className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800"
                          />
                          <span className="text-gray-400 text-xs">=</span>
                          <input
                            type="text"
                            value={c.value}
                            onChange={(e) => updateCookieRow(index, 'value', e.target.value)}
                            placeholder="value"
                            className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => deleteCookieRow(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg shrink-0 cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {cookies.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-zinc-600 italic text-center py-4">
                          No cookies added yet. Custom cookies will be formatted as standard cookie strings on send.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Body Content Tab */}
                {requestTab === 'body' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        Payload Encoding Type
                      </span>

                      <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg flex-wrap gap-0.5">
                        {['none', 'json', 'text', 'form-urlencoded', 'multipart-form'].map((type) => (
                          <button
                            type="button"
                            key={type}
                            onClick={() => setBodyType(type as any)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all uppercase cursor-pointer ${
                              bodyType === type
                                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400'
                            }`}
                          >
                            {type === 'form-urlencoded' ? 'url-encoded' : type === 'multipart-form' ? 'multipart' : type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Standard Text Payload */}
                    {(bodyType === 'json' || bodyType === 'text') && (
                      <textarea
                        value={bodyContent}
                        onChange={(e) => setBodyContent(e.target.value)}
                        placeholder={
                          bodyType === 'json'
                            ? '{\n  "key": "value"\n}'
                            : 'Plain text payload...'
                        }
                        className="w-full min-h-[140px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                      />
                    )}

                    {/* Form Url-Encoded Grid */}
                    {bodyType === 'form-urlencoded' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">application/x-www-form-urlencoded</span>
                          <button
                            type="button"
                            onClick={addFormUrlEncodedRow}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 uppercase cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Row
                          </button>
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-auto">
                          {formUrlEncoded.map((row, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={row.enabled}
                                onChange={(e) => updateFormUrlEncodedRow(index, 'enabled', e.target.checked)}
                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500/20 h-4 w-4 shrink-0"
                              />
                              <input
                                type="text"
                                value={row.key}
                                onChange={(e) => updateFormUrlEncodedRow(index, 'key', e.target.value)}
                                placeholder="key"
                                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none"
                              />
                              <span className="text-gray-400 text-xs">=</span>
                              <input
                                type="text"
                                value={row.value}
                                onChange={(e) => updateFormUrlEncodedRow(index, 'value', e.target.value)}
                                placeholder="value"
                                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => deleteFormUrlEncodedRow(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Multipart Form Grid */}
                    {bodyType === 'multipart-form' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">multipart/form-data</span>
                          <button
                            type="button"
                            onClick={addMultipartFormRow}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 uppercase cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Field
                          </button>
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
                          {multipartForm.map((row, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={row.enabled}
                                onChange={(e) => updateMultipartFormRow(index, 'enabled', e.target.checked)}
                                className="rounded border-gray-300 text-amber-500 h-4 w-4 shrink-0"
                              />
                              
                              <input
                                type="text"
                                value={row.key}
                                onChange={(e) => updateMultipartFormRow(index, 'key', e.target.value)}
                                placeholder="name"
                                className="w-1/3 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none"
                              />

                              <select
                                value={row.type || 'text'}
                                onChange={(e) => updateMultipartFormRow(index, 'type', e.target.value)}
                                className="px-2 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-[10px] font-bold"
                              >
                                <option value="text">Text</option>
                                <option value="file">File</option>
                              </select>

                              <span className="text-gray-400 text-xs">=</span>

                              {row.type === 'file' ? (
                                <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
                                  <input
                                    type="file"
                                    id={`file-upload-field-${index}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        updateMultipartFormRow(index, 'file', file);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`file-upload-field-${index}`)?.click()}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                                  >
                                    {row.file ? 'Change' : 'Attach File'}
                                  </button>
                                  <span className="font-mono text-[10px] truncate max-w-[120px] text-gray-600 dark:text-zinc-400" title={row.file?.name}>
                                    {row.file ? row.file.name : '[No File]'}
                                  </span>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={row.value}
                                  onChange={(e) => updateMultipartFormRow(index, 'value', e.target.value)}
                                  placeholder="value"
                                  className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none"
                                />
                              )}

                              <button
                                type="button"
                                onClick={() => deleteMultipartFormRow(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bodyType === 'none' && (
                      <div className="py-8 text-center rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-600 text-xs italic">
                        GET and HEAD requests usually do not carry an HTTP payload. Switch payload options above to configure.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live cURL Output Generator */}
              <div className="space-y-2 bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" />
                    Live Visual cURL Command
                  </span>
                  <button
                    onClick={() => copyToClipboard(generatedCurl, setCopiedCurl)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 uppercase cursor-pointer"
                  >
                    {copiedCurl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedCurl ? 'Copied!' : 'Copy cURL'}
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-gray-600 dark:text-zinc-400 whitespace-pre-wrap break-all max-h-[120px] overflow-auto focus:outline-none select-all">
                  {generatedCurl}
                </pre>
              </div>
            </div>

            {/* Right Hand: Response Panel */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                HTTP Response
              </span>

              {loading ? (
                <div className="min-h-[350px] rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Sending HTTP Request...</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-[240px]">Fetching content securely from browser client sandbox.</p>
                </div>
              ) : resError ? (
                <div className="min-h-[350px] rounded-2xl border border-red-200 dark:border-red-950/20 bg-red-50/20 dark:bg-red-950/5 p-5 flex flex-col justify-center space-y-4">
                  <div className="flex gap-2 items-start text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">HTTP Request Error</h4>
                      <p className="text-xs leading-relaxed text-red-500 dark:text-red-400/90">{resError}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-gray-100 dark:border-zinc-850 space-y-2">
                    <h5 className="text-[11px] font-bold uppercase text-amber-600 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      Browser CORS Guide
                    </h5>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                      API requests sent client-side inside standard browser environments are governed by <strong>CORS (Cross-Origin Resource Sharing)</strong> policies. If the destination server does not return header values containing <code>Access-Control-Allow-Origin: *</code>, your browser will reject the call before it completes. 
                    </p>
                    <p className="text-[10px] text-gray-400 italic">
                      💡 Tip: Click one of the quick mock presets above to verify that HTTP requests are sending successfully.
                    </p>
                  </div>
                </div>
              ) : resStatus ? (
                <div className="space-y-4">
                  {/* Response Status Indicators */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/30">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Status</span>
                      <span className={`text-sm font-bold font-mono ${
                        resStatus >= 200 && resStatus < 300 
                          ? 'text-emerald-500' 
                          : resStatus >= 300 && resStatus < 400 
                          ? 'text-sky-500' 
                          : 'text-red-500'
                      }`}>
                        {resStatus} {resStatusText}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/30">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Time</span>
                      <span className="text-sm font-bold font-mono text-amber-500">
                        {resTime} ms
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/30">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Size</span>
                      <span className="text-sm font-bold font-mono text-gray-800 dark:text-zinc-200">
                        {resSize || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Response Body Tab */}
                  <div className="rounded-2xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden flex flex-col">
                    <div className="border-b border-gray-150 dark:border-zinc-850 bg-gray-50/50 dark:bg-zinc-900/40 p-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">Response Body</span>
                      <button
                        onClick={() => copyToClipboard(getFormattedResponseBody(), setCopiedResBody)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 uppercase cursor-pointer"
                      >
                        {copiedResBody ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedResBody ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <pre className="p-4 font-mono text-xs text-gray-800 dark:text-zinc-200 whitespace-pre overflow-auto max-h-[250px] min-h-[180px] bg-white dark:bg-zinc-900/30 focus:outline-none select-text">
                      {getFormattedResponseBody() || <span className="italic text-gray-400">[Empty Response]</span>}
                    </pre>

                    {/* Headers nested details */}
                    {Object.keys(resHeaders).length > 0 && (
                      <div className="border-t border-gray-150 dark:border-zinc-850 p-3 bg-gray-50/30 dark:bg-zinc-900/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block mb-2">
                          Response Headers
                        </span>
                        <div className="font-mono text-[10px] text-gray-500 dark:text-zinc-400 space-y-1 max-h-[120px] overflow-auto">
                          {Object.entries(resHeaders).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-gray-400 font-bold shrink-0">{k}:</span>
                              <span className="text-gray-700 dark:text-zinc-300 break-all">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Response Cookies Panel */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Cookie className="w-3.5 h-3.5" />
                        Response Cookies
                      </h4>
                    </div>
                    
                    {parseResponseCookies().length > 0 ? (
                      <div className="space-y-2 max-h-[140px] overflow-auto">
                        {parseResponseCookies().map((cookie, index) => (
                          <div key={index} className="flex flex-col gap-0.5 bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-900 font-mono text-[10px]">
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-700 dark:text-zinc-300">{cookie.key}</span>
                              <span className="text-gray-500 truncate max-w-[150px]" title={cookie.value}>{cookie.value}</span>
                            </div>
                            {(cookie.domain || cookie.path || cookie.expires) && (
                              <div className="text-[8px] text-gray-400 flex gap-2 flex-wrap mt-1">
                                {cookie.domain && <span><strong>Domain:</strong> {cookie.domain}</span>}
                                {cookie.path && <span><strong>Path:</strong> {cookie.path}</span>}
                                {cookie.expires && <span><strong>Expires:</strong> {cookie.expires}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1.5 p-3 bg-gray-50 dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-900">
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 italic">No set-cookie headers detected in response.</p>
                        <p className="text-[9px] text-gray-400 leading-normal">
                          Note: Standard browser CORS rules generally prevent JavaScript from reading cookies sent by remote web APIs. If the endpoint responds with cookies, they are stored automatically by the browser's native cookie jar.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="min-h-[350px] rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-zinc-600 italic text-xs">
                  <Globe className="w-8 h-8 mb-2 text-gray-300 dark:text-zinc-700 animate-pulse" />
                  <span>Configure request attributes and click &apos;Send&apos; to execute and view sandbox response.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
