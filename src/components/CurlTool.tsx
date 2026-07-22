import React, { useState } from 'react';
import { Code, Copy, Check, Terminal } from 'lucide-react';
import { HistoryItem } from '../types';

interface CurlToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

type OutputLanguage = 'fetch' | 'axios' | 'python' | 'go' | 'rust';

export default function CurlTool({ onSaveHistory }: CurlToolProps) {
  const [curlInput, setCurlInput] = useState<string>(
    `curl -X POST "https://api.example.com/v1/data" \\
  -H "Authorization: Bearer token123" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "DevForge", "action": "convert"}'`
  );
  const [targetLang, setTargetLang] = useState<OutputLanguage>('fetch');
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseCurl = (curlStr: string) => {
    let method = 'GET';
    let url = '';
    const headers: Record<string, string> = {};
    let body = '';

    const cleanStr = curlStr.replace(/\\\n/g, ' ');

    // Extract method
    const methodMatch = cleanStr.match(/-X\s+([A-Z]+)/i) || cleanStr.match(/--request\s+([A-Z]+)/i);
    if (methodMatch) method = methodMatch[1].toUpperCase();

    // Extract URL
    const urlMatch = cleanStr.match(/curl\s+(?:-[^\s]+\s+)*['"]?([^'"]+['"]?)/i);
    if (urlMatch) {
      url = urlMatch[1].replace(/['"]/g, '');
    }

    // Extract Headers
    const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/gi;
    let match;
    while ((match = headerRegex.exec(cleanStr)) !== null) {
      const parts = match[1].split(':');
      if (parts.length >= 2) {
        headers[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    }

    // Extract Data/Body
    const dataMatch = cleanStr.match(/(?:-d|--data|--data-raw)\s+['"]([^'"]+)['"]/i);
    if (dataMatch) {
      body = dataMatch[1];
      if (method === 'GET') method = 'POST';
    }

    return { method, url, headers, body };
  };

  const generateCode = (curlStr: string, lang: OutputLanguage) => {
    const { method, url, headers, body } = parseCurl(curlStr);

    switch (lang) {
      case 'fetch':
        return `fetch("${url || 'https://api.example.com'}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 4)},
  ${body ? `body: ${JSON.stringify(body)}` : ''}
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`;

      case 'axios':
        return `import axios from 'axios';

axios({
  method: '${method.toLowerCase()}',
  url: '${url || 'https://api.example.com'}',
  headers: ${JSON.stringify(headers, null, 4)},
  ${body ? `data: ${body}` : ''}
})
  .then(res => console.log(res.data))
  .catch(err => console.error(err));`;

      case 'python':
        return `import requests

url = "${url || 'https://api.example.com'}"
headers = ${JSON.stringify(headers, null, 4)}
${body ? `data = ${JSON.stringify(body)}` : ''}

response = requests.request("${method}", url, headers=headers${body ? ', data=data' : ''})
print(response.json())`;

      case 'go':
        return `package main

import (
	"fmt"
	"net/http"
	"io"
	"strings"
)

func main() {
	url := "${url || 'https://api.example.com'}"
	${body ? `payload := strings.NewReader(\`${body}\`)` : 'var payload io.Reader = nil'}
	req, _ := http.NewRequest("${method}", url, payload)

${Object.entries(headers).map(([k, v]) => `	req.Header.Add("${k}", "${v}")`).join('\n')}

	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}`;

      case 'rust':
        return `use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std.error::Error>> {
    let client = Client::new();
    let res = client.${method.toLowerCase()}("${url || 'https://api.example.com'}")
${Object.entries(headers).map(([k, v]) => `        .header("${k}", "${v}")`).join('\n')}
${body ? `        .body(r#"${body}"#)` : ''}
        .send()
        .await?;

    println!("{:#?}", res.text().await?);
    Ok(())
}`;
    }
  };

  const codeOutput = generateCode(curlInput, targetLang);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-500" />
            cURL to Executable Code Converter
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Convert terminal cURL commands to JavaScript, Python, Go, or Rust snippets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input cURL */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
            Paste Raw cURL Command
          </label>
          <textarea
            rows={10}
            value={curlInput}
            onChange={(e) => setCurlInput(e.target.value)}
            className="w-full p-4 font-mono text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            placeholder="curl -X GET ..."
          />
        </div>

        {/* Output Code */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['fetch', 'axios', 'python', 'go', 'rust'] as OutputLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTargetLang(lang)}
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-lg border transition-all ${
                    targetLang === lang
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={() => copyToClipboard(codeOutput)}
              className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>

          <pre className="p-4 font-mono text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-emerald-400 overflow-x-auto min-h-[220px]">
            {codeOutput}
          </pre>
        </div>
      </div>
    </div>
  );
}
