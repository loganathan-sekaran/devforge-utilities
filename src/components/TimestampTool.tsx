import React, { useState, useEffect } from 'react';
import { Clock, Copy, Check, Calendar, Globe, Zap, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { HistoryItem } from '../types';

interface TimestampToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

const PRESET_TIMEZONES = [
  { label: 'IST (Asia/Kolkata)', tz: 'Asia/Kolkata', flag: '🇮🇳', offset: '+05:30' },
  { label: 'UTC', tz: 'UTC', flag: '🌍', offset: '+00:00' },
  { label: 'EST (America/New_York)', tz: 'America/New_York', flag: '🇺🇸', offset: '-05:00' },
  { label: 'PST (America/Los_Angeles)', tz: 'America/Los_Angeles', flag: '🇺🇸', offset: '-08:00' },
  { label: 'GMT (Europe/London)', tz: 'Europe/London', flag: '🇬🇧', offset: '+00:00' },
  { label: 'JST (Asia/Tokyo)', tz: 'Asia/Tokyo', flag: '🇯🇵', offset: '+09:00' },
];

export default function TimestampTool({ onSaveHistory, history }: TimestampToolProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [isTicking, setIsTicking] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Timezone selection
  const [selectedTz, setSelectedTz] = useState<string>('Asia/Kolkata');

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
        <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
          Quick Select Target Timezone
        </label>
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
