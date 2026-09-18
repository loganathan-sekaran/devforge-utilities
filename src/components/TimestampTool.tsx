import React, { useState, useEffect } from 'react';
import { Clock, Copy, Check, Calendar, Globe, Zap, ArrowRightLeft, RefreshCw, BookmarkPlus } from 'lucide-react';
import { HistoryItem } from '../types';

interface TimestampToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

export const PRESET_TIMEZONES = [
  { label: 'IST (Asia/Kolkata)', tz: 'Asia/Kolkata', flag: '🇮🇳', offset: '+05:30' },
  { label: 'UTC', tz: 'UTC', flag: '🌍', offset: '+00:00' },
  { label: 'EST (America/New_York)', tz: 'America/New_York', flag: '🇺🇸', offset: '-05:00' },
  { label: 'PST (America/Los_Angeles)', tz: 'America/Los_Angeles', flag: '🇺🇸', offset: '-08:00' },
  { label: 'GMT (Europe/London)', tz: 'Europe/London', flag: '🇬🇧', offset: '+00:00' },
  { label: 'JST (Asia/Tokyo)', tz: 'Asia/Tokyo', flag: '🇯🇵', offset: '+09:00' },
  { label: 'CET (Europe/Paris)', tz: 'Europe/Paris', flag: '🇪🇺', offset: '+01:00' },
  { label: 'SGT (Asia/Singapore)', tz: 'Asia/Singapore', flag: '🇸🇬', offset: '+08:00' },
  { label: 'AEST (Australia/Sydney)', tz: 'Australia/Sydney', flag: '🇦🇺', offset: '+10:00' },
  { label: 'GST (Asia/Dubai)', tz: 'Asia/Dubai', flag: '🇦🇪', offset: '+04:00' },
];

export const ALL_SUPPORTED_TIMEZONES: string[] = (() => {
  try {
    if (typeof Intl !== 'undefined' && typeof (Intl as any).supportedValuesOf === 'function') {
      return (Intl as any).supportedValuesOf('timeZone');
    }
  } catch {
    // fallback
  }
  return PRESET_TIMEZONES.map(t => t.tz);
})();

// Helper to calculate target timezone offset at a given date in milliseconds
export function getTargetTimezoneOffsetMs(date: Date, timeZone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(date);
    const m: Record<string, string> = {};
    for (const p of parts) m[p.type] = p.value;
    const asUtc = Date.UTC(
      parseInt(m.year, 10),
      parseInt(m.month, 10) - 1,
      parseInt(m.day, 10),
      parseInt(m.hour, 10) === 24 ? 0 : parseInt(m.hour, 10),
      parseInt(m.minute, 10),
      parseInt(m.second, 10)
    );
    return asUtc - date.getTime();
  } catch {
    return 0;
  }
}

// Convert a date-time specified in a target timezone into true UTC Date
export function parseTimeInTimezoneToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const approx = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTargetTimezoneOffsetMs(approx, timeZone);
  let utc = new Date(approx.getTime() - offset);
  const offset2 = getTargetTimezoneOffsetMs(utc, timeZone);
  if (offset2 !== offset) {
    utc = new Date(approx.getTime() - offset2);
  }
  return utc;
}

export function getTimezoneOffsetString(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT';
    let formatted = tzPart.replace('GMT', '');
    if (!formatted) return '+00:00';
    if (/^[+-]\d$/.test(formatted)) formatted = formatted.replace(/([+-])(\d)/, '$10$2:00');
    else if (/^[+-]\d{2}$/.test(formatted)) formatted = `${formatted}:00`;
    else if (/^[+-]\d:\d{2}$/.test(formatted)) formatted = formatted.replace(/([+-])(\d):/, '$10$2:');
    return formatted;
  } catch {
    return '+00:00';
  }
}

export function parseDateTimeString(str: string) {
  if (!str) return null;
  const match = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
    hour: match[4] ? parseInt(match[4], 10) : 0,
    minute: match[5] ? parseInt(match[5], 10) : 0,
    second: match[6] ? parseInt(match[6], 10) : 0,
  };
}

export function formatDateTimeInTz(date: Date, timeZone: string) {
  try {
    const f24 = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      hourCycle: 'h23',
    });
    const parts = f24.formatToParts(date);
    const m: Record<string, string> = {};
    for (const p of parts) m[p.type] = p.value;
    const y = m.year;
    const mo = m.month;
    const d = m.day;
    const h = m.hour === '24' ? '00' : m.hour;
    const mi = m.minute;
    const s = m.second;

    const fHuman = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const offsetStr = timeZone === 'UTC' ? '+00:00' : getTimezoneOffsetString(date, timeZone);
    const isoString = timeZone === 'UTC' ? date.toISOString() : `${y}-${mo}-${d}T${h}:${mi}:${s}${offsetStr}`;

    return {
      formatted24: `${y}-${mo}-${d} ${h}:${mi}:${s}`,
      formattedInput: `${y}-${mo}-${d}T${h}:${mi}:${s}`,
      formatted12: fHuman.format(date),
      isoString,
      offsetStr,
      dateString: `${y}-${mo}-${d}`,
    };
  } catch {
    return null;
  }
}

export default function TimestampTool({ onSaveHistory, history }: TimestampToolProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [isTicking, setIsTicking] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Timezone selection
  const [selectedTz, setSelectedTz] = useState<string>('Asia/Kolkata');

  // Bidirectional UTC <-> Timezone Converter State
  const [convDirection, setConvDirection] = useState<'utc_to_tz' | 'tz_to_utc'>('utc_to_tz');
  const [convInputTime, setConvInputTime] = useState<string>(() => {
    return new Date().toISOString().slice(0, 16);
  });

  // Epoch to Date state
  const [inputEpoch, setInputEpoch] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [inputEpochUnit, setInputEpochUnit] = useState<'seconds' | 'milliseconds'>('seconds');

  // Date to Epoch state
  const [inputDateStr, setInputDateStr] = useState<string>(new Date().toISOString().slice(0, 16));

  // Live ticker interval
  useEffect(() => {
    if (!isTicking) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isTicking]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert input epoch to Date object
  const getParsedEpochDate = (): Date | null => {
    if (!inputEpoch.trim()) return null;
    const num = Number(inputEpoch.trim());
    if (isNaN(num)) return null;
    if (inputEpochUnit === 'seconds') {
      return new Date(num * 1000);
    }
    return new Date(num);
  };

  const parsedEpochDate = getParsedEpochDate();

  // Helper to format date into ISO formats and specified timezone
  const formatInTimezone = (date: Date, timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return 'Invalid Timezone';
    }
  };

  const getIsoStringWithOffset = (date: Date, timeZone: string): string => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'shortOffset',
      }).formatToParts(date);

      const map: Record<string, string> = {};
      parts.forEach(p => (map[p.type] = p.value));
      const year = map.year;
      const month = map.month;
      const day = map.day;
      const hour = map.hour;
      const minute = map.minute;
      const second = map.second;
      const tzName = map.timeZoneName || 'UTC';
      
      // Convert GMT+5:30 to +05:30
      let formattedOffset = tzName.replace('GMT', '');
      if (!formattedOffset) formattedOffset = '+00:00';
      else if (/^[+-]\d$/.test(formattedOffset)) formattedOffset = formattedOffset.replace(/([+-])(\d)/, '$10$2:00');
      else if (/^[+-]\d{2}$/.test(formattedOffset)) formattedOffset = `${formattedOffset}:00`;
      else if (/^[+-]\d:\d{2}$/.test(formattedOffset)) formattedOffset = formattedOffset.replace(/([+-])(\d):/, '$10$2:');

      return `${year}-${month}-${day}T${hour}:${minute}:${second}${formattedOffset}`;
    } catch {
      return date.toISOString();
    }
  };

  const handleSetCurrentTimestamp = () => {
    const currentSeconds = Math.floor(Date.now() / 1000).toString();
    setInputEpoch(currentSeconds);
    setInputEpochUnit('seconds');
    onSaveHistory(`Convert Current Epoch`, currentSeconds, { unit: 'seconds' });
  };

  // Date picker conversion handler
  const parsedDatePickerDate = new Date(inputDateStr);
  const datePickerEpochSeconds = !isNaN(parsedDatePickerDate.getTime()) ? Math.floor(parsedDatePickerDate.getTime() / 1000) : null;
  const datePickerEpochMs = !isNaN(parsedDatePickerDate.getTime()) ? parsedDatePickerDate.getTime() : null;

  // Bidirectional Converter calculations
  const getBidirectionalConversion = () => {
    if (!convInputTime.trim()) return null;
    const parts = parseDateTimeString(convInputTime);
    if (!parts) return null;

    try {
      let targetDate: Date;
      let targetTzName: string;

      if (convDirection === 'utc_to_tz') {
        targetDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));
        targetTzName = selectedTz;
      } else {
        targetDate = parseTimeInTimezoneToUtc(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second, selectedTz);
        targetTzName = 'UTC';
      }

      if (isNaN(targetDate.getTime())) return null;

      const outputDetails = formatDateTimeInTz(targetDate, targetTzName);
      if (!outputDetails) return null;

      const inputDatePart = `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`;
      
      let dayDiffLabel = 'Same calendar day';
      let dayDiffClass = 'text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800';
      if (inputDatePart < outputDetails.dateString) {
        dayDiffLabel = '+1 day ahead';
        dayDiffClass = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50';
      } else if (inputDatePart > outputDetails.dateString) {
        dayDiffLabel = '-1 day behind';
        dayDiffClass = 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50';
      }

      return {
        outputDetails,
        targetTzName,
        epochSeconds: Math.floor(targetDate.getTime() / 1000),
        epochMs: targetDate.getTime(),
        dayDiffLabel,
        dayDiffClass,
      };
    } catch {
      return null;
    }
  };

  const convResult = getBidirectionalConversion();

  const handleSwapDirection = () => {
    const nextDirection = convDirection === 'utc_to_tz' ? 'tz_to_utc' : 'utc_to_tz';
    setConvDirection(nextDirection);
    if (convResult?.outputDetails?.formattedInput) {
      setConvInputTime(convResult.outputDetails.formattedInput);
    }
  };

  const handleSetCurrentConvTime = () => {
    const currentDate = new Date();
    if (convDirection === 'utc_to_tz') {
      setConvInputTime(currentDate.toISOString().slice(0, 19));
    } else {
      const formatted = formatDateTimeInTz(currentDate, selectedTz);
      setConvInputTime(formatted ? formatted.formattedInput : currentDate.toISOString().slice(0, 19));
    }
  };

  const handleSaveConvHistory = () => {
    if (!convResult) return;
    const directionLabel = convDirection === 'utc_to_tz' ? `UTC ➔ ${selectedTz}` : `${selectedTz} ➔ UTC`;
    onSaveHistory(
      `${directionLabel}: ${convInputTime}`,
      convResult.outputDetails.formatted24,
      {
        direction: convDirection,
        timezone: selectedTz,
        iso: convResult.outputDetails.isoString,
        epoch: convResult.epochSeconds
      }
    );
  };

  const selectedTzPreset = PRESET_TIMEZONES.find(t => t.tz === selectedTz);
  const selectedTzShortLabel = selectedTz === 'Asia/Kolkata' ? 'IST' : (selectedTzPreset?.label || selectedTz.split('/').pop()?.replace('_', ' ') || selectedTz);

  return (
    <div className="space-y-8">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            Unix Timestamp & Epoch Converter
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Real-time UTC clock, instant timezone translation, and ISO format generator.
          </p>
        </div>

        <button
          onClick={() => setIsTicking(!isTicking)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isTicking
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin' : ''}`} />
          <span>{isTicking ? 'Live Clock Active' : 'Clock Paused'}</span>
        </button>
      </div>

      {/* Live Epoch Ticker Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Unix Epoch */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-850 p-4 rounded-xl border border-blue-100 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              Current Unix Epoch
            </span>
            <button
              onClick={() => copyToClipboard(Math.floor(now.getTime() / 1000).toString(), 'live-epoch')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Copy Epoch Seconds"
            >
              {copiedKey === 'live-epoch' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
            {Math.floor(now.getTime() / 1000)}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-zinc-500 font-mono">
            {now.getTime()} ms
          </div>
        </div>

        {/* Current UTC Time */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-zinc-900 dark:to-zinc-850 p-4 rounded-xl border border-emerald-100 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              Current UTC Time
            </span>
            <button
              onClick={() => copyToClipboard(now.toISOString(), 'live-utc')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Copy ISO UTC string"
            >
              {copiedKey === 'live-utc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate">
            {now.toUTCString().slice(17, 25)} UTC
          </div>
          <div className="text-[10px] text-gray-500 dark:text-zinc-500 font-mono truncate">
            {now.toISOString()}
          </div>
        </div>

        {/* Local System Time */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-850 p-4 rounded-xl border border-purple-100 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              Local System Time
            </span>
            <button
              onClick={() => copyToClipboard(now.toLocaleString(), 'live-local')}
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              title="Copy local string"
            >
              {copiedKey === 'live-local' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-base font-mono font-bold text-purple-700 dark:text-purple-400 truncate">
            {now.toLocaleTimeString()}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-zinc-500 font-mono truncate">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
        </div>
      </div>

      {/* Timezone Quick Selector Bar */}
      <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
            Quick Select Target Timezone
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-zinc-400">Or choose:</span>
            <select
              value={selectedTz}
              onChange={(e) => setSelectedTz(e.target.value)}
              className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <optgroup label="Popular Timezones">
                {PRESET_TIMEZONES.map(t => (
                  <option key={t.tz} value={t.tz}>
                    {t.flag} {t.label} ({t.offset})
                  </option>
                ))}
              </optgroup>
              <optgroup label="All Supported Timezones">
                {ALL_SUPPORTED_TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_TIMEZONES.map(tz => {
            const isSelected = selectedTz === tz.tz;
            return (
              <button
                key={tz.tz}
                onClick={() => setSelectedTz(tz.tz)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-blue-400'
                }`}
              >
                <span>{tz.flag}</span>
                <span>{tz.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NEW SECTION: UTC ⇄ Selected Timezone Converter (To & Fro) */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-indigo-100 dark:border-indigo-950/60 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
        {/* Header & Direction Switch */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                  UTC ⇄ Timezone Converter (To &amp; Fro)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Convert any selected time between UTC and {selectedTzShortLabel} in either direction.
              </p>
            </div>
          </div>

          {/* Direction Toggle Pills and Swap Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 bg-gray-100 dark:bg-zinc-800/80 rounded-xl text-xs font-medium border border-gray-200/60 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => setConvDirection('utc_to_tz')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  convDirection === 'utc_to_tz'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                UTC ➔ {selectedTzShortLabel}
              </button>
              <button
                type="button"
                onClick={() => setConvDirection('tz_to_utc')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  convDirection === 'tz_to_utc'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                {selectedTzShortLabel} ➔ UTC
              </button>
            </div>

            <button
              type="button"
              onClick={handleSwapDirection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all active:scale-95"
              title="Swap Direction (To and Fro)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Swap Direction</span>
            </button>
          </div>
        </div>

        {/* Input and Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Selection */}
          <div className="space-y-4 bg-gray-50/60 dark:bg-zinc-800/30 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Source Date &amp; Time
              </label>
              <button
                type="button"
                onClick={handleSetCurrentConvTime}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Use Current Time</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                Input timezone:{' '}
                <span className="font-semibold text-gray-800 dark:text-zinc-200 font-mono">
                  {convDirection === 'utc_to_tz' ? 'UTC (Universal Coordinated Time)' : `${selectedTz} (${selectedTzShortLabel})`}
                </span>
              </div>
              <input
                type="datetime-local"
                step="1"
                value={convInputTime}
                onChange={(e) => setConvInputTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                placeholder="YYYY-MM-DDTHH:mm:ss"
              />
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                Pick a date &amp; time or paste a standard timestamp (e.g. <code className="font-mono text-indigo-600 dark:text-indigo-400">2026-09-18T14:30:00</code>).
              </p>
            </div>

            {/* Target Timezone Info */}
            <div className="pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600 dark:text-zinc-400">Target Timezone:</span>
                <span className="font-bold text-gray-800 dark:text-zinc-200">
                  {convDirection === 'utc_to_tz' ? `${selectedTz} (${selectedTzShortLabel})` : 'UTC'}
                </span>
              </div>
              {convDirection === 'utc_to_tz' && (
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Switch the target timezone using the selector bar above anytime.
                </p>
              )}
            </div>
          </div>

          {/* Right: Converted Result Output */}
          <div className="space-y-4">
            {convResult ? (
              <div className="space-y-3">
                {/* Main Converted Time Display Card */}
                <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 dark:from-indigo-950/30 dark:to-zinc-850 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    <span className="uppercase tracking-wider">
                      Converted Result ({convResult.targetTzName === 'UTC' ? 'UTC' : selectedTzShortLabel})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${convResult.dayDiffClass}`}>
                        {convResult.dayDiffLabel}
                      </span>
                      <button
                        onClick={() => copyToClipboard(convResult.outputDetails.formatted24, 'conv-24')}
                        className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 transition-colors"
                        title="Copy converted time"
                      >
                        {copiedKey === 'conv-24' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-2xl font-mono font-bold text-gray-900 dark:text-zinc-100">
                    {convResult.outputDetails.formatted24}
                  </div>

                  <div className="text-xs font-medium text-indigo-800 dark:text-indigo-300">
                    {convResult.outputDetails.formatted12}
                  </div>

                  <div className="text-[11px] text-gray-600 dark:text-zinc-400 flex items-center gap-2 pt-1 border-t border-indigo-100/80 dark:border-indigo-900/30">
                    <span>Offset: <code className="font-mono font-semibold">{convResult.outputDetails.offsetStr}</code></span>
                    <span>•</span>
                    <span>Zone: <span className="font-medium">{convResult.targetTzName}</span></span>
                  </div>
                </div>

                {/* ISO String Output */}
                <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700/60 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                    <span>ISO 8601 Equivalent</span>
                    <button
                      onClick={() => copyToClipboard(convResult.outputDetails.isoString, 'conv-iso')}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {copiedKey === 'conv-iso' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-xs font-mono font-semibold text-gray-800 dark:text-zinc-200 break-all">
                    {convResult.outputDetails.isoString}
                  </div>
                </div>

                {/* Unix Epoch Seconds */}
                <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700/60 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                    <span>Unix Epoch Timestamp</span>
                    <button
                      onClick={() => copyToClipboard(convResult.epochSeconds.toString(), 'conv-epoch')}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {copiedKey === 'conv-epoch' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-xs font-mono font-semibold text-gray-800 dark:text-zinc-200">
                    {convResult.epochSeconds} <span className="text-[10px] text-gray-400">({convResult.epochMs} ms)</span>
                  </div>
                </div>

                {/* Save to History Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveConvHistory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 transition-colors"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save Conversion to History</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/40">
                Please enter a valid date &amp; time to convert.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Converter Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Epoch to Human Readable & ISO */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
              Epoch ➔ Human Readable & ISO Formats
            </h3>
            <button
              onClick={handleSetCurrentTimestamp}
              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Use Current Epoch
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputEpoch}
              onChange={(e) => setInputEpoch(e.target.value)}
              placeholder="e.g. 1774175339"
              className="flex-1 px-3 py-2 text-sm font-mono bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            <select
              value={inputEpochUnit}
              onChange={(e) => setInputEpochUnit(e.target.value as 'seconds' | 'milliseconds')}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="seconds">Seconds</option>
              <option value="milliseconds">Milliseconds</option>
            </select>
          </div>

          {parsedEpochDate ? (
            <div className="space-y-3 pt-2">
              {/* Target Timezone Result */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  <span>Selected Timezone ({selectedTz})</span>
                  <button
                    onClick={() => copyToClipboard(formatInTimezone(parsedEpochDate, selectedTz), 'target-tz')}
                    className="hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {copiedKey === 'target-tz' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-sm font-mono font-bold text-gray-900 dark:text-zinc-100">
                  {formatInTimezone(parsedEpochDate, selectedTz)}
                </div>
              </div>

              {/* ISO-8601 UTC */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                  <span>ISO 8601 (UTC)</span>
                  <button onClick={() => copyToClipboard(parsedEpochDate.toISOString(), 'iso-utc')}>
                    {copiedKey === 'iso-utc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-xs font-mono text-gray-800 dark:text-zinc-200">
                  {parsedEpochDate.toISOString()}
                </div>
              </div>

              {/* ISO-8601 with Offset */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                  <span>ISO 8601 (Target Offset)</span>
                  <button onClick={() => copyToClipboard(getIsoStringWithOffset(parsedEpochDate, selectedTz), 'iso-offset')}>
                    {copiedKey === 'iso-offset' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-xs font-mono text-gray-800 dark:text-zinc-200">
                  {getIsoStringWithOffset(parsedEpochDate, selectedTz)}
                </div>
              </div>

              {/* RFC 2822 */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                  <span>RFC 2822</span>
                  <button onClick={() => copyToClipboard(parsedEpochDate.toUTCString(), 'rfc2822')}>
                    {copiedKey === 'rfc2822' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-xs font-mono text-gray-800 dark:text-zinc-200">
                  {parsedEpochDate.toUTCString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg">
              Please enter a valid numeric Unix timestamp.
            </div>
          )}
        </div>

        {/* Section 2: Date/Time Picker ➔ Epoch */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            Date & Time ➔ Unix Epoch
          </h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
              Select Date and Local Time
            </label>
            <input
              type="datetime-local"
              value={inputDateStr}
              onChange={(e) => setInputDateStr(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>

          {datePickerEpochSeconds !== null ? (
            <div className="space-y-3 pt-2">
              {/* Epoch Seconds Output */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <span>Unix Epoch (Seconds)</span>
                  <button onClick={() => copyToClipboard(datePickerEpochSeconds.toString(), 'dp-sec')}>
                    {copiedKey === 'dp-sec' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-xl font-mono font-bold text-gray-900 dark:text-zinc-100">
                  {datePickerEpochSeconds}
                </div>
              </div>

              {/* Epoch Milliseconds Output */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                  <span>Unix Epoch (Milliseconds)</span>
                  <button onClick={() => copyToClipboard(datePickerEpochMs!.toString(), 'dp-ms')}>
                    {copiedKey === 'dp-ms' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-sm font-mono text-gray-800 dark:text-zinc-200">
                  {datePickerEpochMs}
                </div>
              </div>

              {/* ISO String Output */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                  <span>Equivalent UTC ISO String</span>
                  <button onClick={() => copyToClipboard(parsedDatePickerDate.toISOString(), 'dp-iso')}>
                    {copiedKey === 'dp-iso' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-xs font-mono text-gray-800 dark:text-zinc-200">
                  {parsedDatePickerDate.toISOString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg">
              Please enter a valid date and time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
