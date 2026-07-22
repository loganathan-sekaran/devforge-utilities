import React, { useState } from 'react';
import { Palette, Copy, Check, ShieldCheck } from 'lucide-react';
import { HistoryItem } from '../types';

interface ColorToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

export default function ColorTool({ onSaveHistory }: ColorToolProps) {
  const [colorHex, setColorHex] = useState<string>('#3B82F6');
  const [bgHex, setBgHex] = useState<string>('#FFFFFF');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return null;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const calculateContrast = (hex1: string, hex2: string) => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 1;
    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const rgb = hexToRgb(colorHex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
  const contrastRatio = calculateContrast(colorHex, bgHex);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Palette className="w-6 h-6 text-pink-500" />
            Color Code Converter & WCAG Contrast Checker
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Convert HEX, RGB, and HSL colors and check accessibility contrast ratios.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Input & Formats */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-14 h-14 rounded-xl cursor-pointer border border-gray-200 dark:border-zinc-700 p-1"
            />
            <input
              type="text"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="flex-1 px-4 py-2 font-mono text-sm uppercase bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>

          {rgb && hsl && (
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">RGB</span>
                  <div className="text-sm font-mono font-bold text-gray-800 dark:text-zinc-200">
                    rgb({rgb.r}, {rgb.g}, {rgb.b})
                  </div>
                </div>
                <button onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}>
                  {copiedKey === 'rgb' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">HSL</span>
                  <div className="text-sm font-mono font-bold text-gray-800 dark:text-zinc-200">
                    hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
                  </div>
                </div>
                <button onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')}>
                  {copiedKey === 'hsl' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contrast Checker Card */}
        <div className="bg-gray-50 dark:bg-zinc-850 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>WCAG 2.1 Contrast Checker</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Background Color:</label>
            <input
              type="color"
              value={bgHex}
              onChange={(e) => setBgHex(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border p-0.5"
            />
            <span className="font-mono text-xs font-bold text-gray-800 dark:text-zinc-200">{bgHex}</span>
          </div>

          {/* Sample Preview Box */}
          <div
            className="p-6 rounded-xl border text-center transition-colors"
            style={{ backgroundColor: bgHex, color: colorHex, borderColor: colorHex + '40' }}
          >
            <div className="text-lg font-bold">Sample Text Preview</div>
            <div className="text-xs opacity-80 mt-1">Testing readability over background</div>
          </div>

          {/* Contrast Score & Badges */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold">Contrast Ratio</span>
              <div className="text-xl font-mono font-bold text-gray-900 dark:text-zinc-100">
                {contrastRatio.toFixed(2)} : 1
              </div>
            </div>

            <div className="flex gap-2">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${contrastRatio >= 4.5 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'}`}>
                AA ({contrastRatio >= 4.5 ? 'Pass' : 'Fail'})
              </span>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${contrastRatio >= 7.0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'}`}>
                AAA ({contrastRatio >= 7.0 ? 'Pass' : 'Fail'})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
