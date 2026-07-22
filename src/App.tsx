import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Sun,
  Moon,
  Clock,
  Zap,
  Menu,
  Braces,
  Binary,
  FileCode,
  Search,
  Hash,
  Layers,
  Columns,
  Sparkles,
  ChevronRight,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Trash2,
  AlertTriangle,
  Link,
  Globe,
  Award,
  BookOpen,
  Github,
  Calendar,
  Terminal,
  Palette,
  Database,
  Home
} from 'lucide-react';
import { HistoryItem, BackgroundJob, ToolType } from './types';
import JSONTool from './components/JSONTool';
import Base64UrlTool from './components/Base64UrlTool';
import JWTTool from './components/JWTTool';
import RegexTool from './components/RegexTool';
import HashTool from './components/HashTool';
import UUIDTool from './components/UUIDTool';
import DiffTool from './components/DiffTool';
import GlobalHistoryPanel from './components/GlobalHistoryPanel';
import JobsTracker from './components/JobsTracker';
import RestNetworkTool from './components/RestNetworkTool';
import PemTool from './components/PemTool';
import MarkdownTool from './components/MarkdownTool';
import TimestampTool from './components/TimestampTool';
import CronTool from './components/CronTool';
import CurlTool from './components/CurlTool';
import ColorTool from './components/ColorTool';
import SqlTool from './components/SqlTool';
import EscaperTool from './components/EscaperTool';
import ChmodTool from './components/ChmodTool';
import HomeTool from './components/HomeTool';

const categories = [
  { id: 'formatters', name: 'Data Formatters' },
  { id: 'encoders', name: 'Encoders & Decoders' },
  { id: 'security', name: 'Security & Crypto' },
  { id: 'text', name: 'Text Utils' },
  { id: 'network', name: 'Network & API' }
];

export default function App() {
  const toolsList = [
    { id: 'json', name: 'JSON Formatter', desc: 'Beautify or minify JSON', icon: Braces, category: 'formatters' },
    { id: 'sql', name: 'SQL Formatter', desc: 'Beautify & minify SQL queries', icon: Database, category: 'formatters' },
    { id: 'base64', name: 'Base64 Encoder/Decoder', desc: 'Encode or decode Base64 data & files', icon: Binary, category: 'encoders' },
    { id: 'url', name: 'URL Encoder/Decoder', desc: 'Encode or decode URL parameters offline', icon: Link, category: 'encoders' },
    { id: 'escaper', name: 'HTML & String Escaper', desc: 'Escape HTML entities & JS strings', icon: Binary, category: 'encoders' },
    { id: 'jwt', name: 'JWT Viewer', desc: 'Decode token claims offline', icon: FileCode, category: 'security' },
    { id: 'pem', name: 'PEM Key & Cert Decoder', desc: 'Decode keys & X.509 certificates', icon: Award, category: 'security' },
    { id: 'hash', name: 'Hash Generator', desc: 'MD5, SHA-256, SHA-512', icon: Hash, category: 'security' },
    { id: 'chmod', name: 'Chmod Calculator', desc: 'Linux file permissions octal & symbolic', icon: Shield, category: 'security' },
    { id: 'timestamp', name: 'Unix Timestamp & Epoch', desc: 'Live UTC clock & timezone converter', icon: Clock, category: 'text' },
    { id: 'cron', name: 'Cron Parser & Explainer', desc: 'Human-readable cron schedule explainer', icon: Calendar, category: 'text' },
    { id: 'regex', name: 'Regex Validator', desc: 'PCRE pattern highlighter', icon: Search, category: 'text' },
    { id: 'markdown', name: 'MD File Previewer', desc: 'Live render markdown documents', icon: BookOpen, category: 'text' },
    { id: 'uuid', name: 'UUID Generator', desc: 'Bulk generate v4 UUIDs', icon: Layers, category: 'text' },
    { id: 'diff', name: 'Diff Checker', desc: 'Compare side-by-side lines', icon: Columns, category: 'text' },
    { id: 'color', name: 'Color & Contrast Checker', desc: 'HEX/RGB converter & WCAG contrast', icon: Palette, category: 'text' },
    { id: 'rest', name: 'REST Client & Curl Generator', desc: 'Visual HTTP and Curl executor', icon: Globe, category: 'network' },
    { id: 'curl', name: 'cURL to Code Converter', desc: 'Convert cURL commands to JS/Python/Go/Rust', icon: Terminal, category: 'network' },
  ] as const;

  const validToolIds: ToolType[] = [
    'home', 'json', 'sql', 'base64', 'url', 'escaper', 'jwt', 'pem', 'hash', 'chmod',
    'timestamp', 'cron', 'regex', 'markdown', 'uuid', 'diff', 'color', 'rest', 'curl'
  ];

  const [activeTab, setActiveTab] = useState<ToolType>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1) as ToolType;
      if (validToolIds.includes(hash)) {
        return hash;
      }
    }
    return 'home';
  });
  const [activeCategory, setActiveCategory] = useState<string>('formatters');

  // Synchronize hash and title for bookmarking support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = activeTab;
      const currentTool = toolsList.find(t => t.id === activeTab);
      document.title = currentTool ? `DevForge Utilities - ${currentTool.name}` : 'DevForge Utilities';
    }
  }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [clearConfirm, setClearConfirm] = useState<boolean>(false);
  const [clearSuccess, setClearSuccess] = useState<boolean>(false);

  // Menu Drawer / Sidebar states
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [jobsOpen, setJobsOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('dev_tools_sidebar_expanded');
    return saved !== 'false';
  });

  const [isHoveringSidebar, setIsHoveringSidebar] = useState<boolean>(false);
  const sidebarTimerRef = useRef<any>(null);
  const autoCollapseActiveRef = useRef<boolean>(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (sidebarTimerRef.current) {
        clearTimeout(sidebarTimerRef.current);
      }
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      localStorage.setItem('dev_tools_sidebar_expanded', String(next));
      return next;
    });
  };

  // Synchronize category selection when active tab changes
  useEffect(() => {
    const activeTool = toolsList.find(t => t.id === activeTab);
    if (activeTool) {
      setActiveCategory(activeTool.category);
    }
  }, [activeTab]);

  // Priority based search tool filtering
  const getSearchMatches = (queryStr: string) => {
    const query = queryStr.trim().toLowerCase();
    if (!query) return [];

    const directMatches = toolsList.filter(
      tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.desc.toLowerCase().includes(query)
    );

    const matchedCategories = categories.filter(
      cat => cat.name.toLowerCase().includes(query)
    );
    const categoryToolMatches = toolsList.filter(
      tool => matchedCategories.some(cat => cat.id === tool.category)
    );

    const combined = [...directMatches];
    for (const tool of categoryToolMatches) {
      if (!combined.some(t => t.id === tool.id)) {
        combined.push(tool);
      }
    }

    return combined;
  };

  // Initialize and load preferences from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('dev_tools_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    const savedHistory = localStorage.getItem('dev_tools_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse operation history', e);
      }
    }

    const savedJobs = localStorage.getItem('dev_tools_jobs');
    if (savedJobs) {
      try {
        const parsedJobs: BackgroundJob[] = JSON.parse(savedJobs);
        const validatedJobs = parsedJobs.map(job => 
          job.status === 'running' 
            ? { ...job, status: 'failed' as const, error: 'Task was interrupted' } 
            : job
        );
        setJobs(validatedJobs);
      } catch (e) {
        console.error('Failed to rehydrate background tasks', e);
      }
    }
  }, []);

  const saveHistoryToStorage = (updatedHistory: HistoryItem[]) => {
    setHistory(updatedHistory);
    localStorage.setItem('dev_tools_history', JSON.stringify(updatedHistory));
  };

  const saveJobsToStorage = (updatedJobs: BackgroundJob[]) => {
    setJobs(updatedJobs);
    localStorage.setItem('dev_tools_jobs', JSON.stringify(updatedJobs));
  };

  const handleToggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('dev_tools_theme', nextDark ? 'dark' : 'light');
  };

  const handleSaveHistory = (input: string, output: string, metadata?: Record<string, any>) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      tool: activeTab,
      timestamp: Date.now(),
      input,
      output,
      metadata,
    };
    const updated = [newItem, ...history].slice(0, 100);
    saveHistoryToStorage(updated);
  };

  const handleClearHistory = () => {
    saveHistoryToStorage([]);
  };

  const handleRemoveHistoryItem = (id: string) => {
    const filtered = history.filter(item => item.id !== id);
    saveHistoryToStorage(filtered);
  };

  const handleAddJob = (job: BackgroundJob) => {
    const updated = [job, ...jobs];
    saveJobsToStorage(updated);
  };

  const handleUpdateJobProgress = (
    id: string,
    progress: number,
    status: 'running' | 'completed' | 'failed',
    result?: any,
    error?: string
  ) => {
    const updated = jobs.map(job => {
      if (job.id === id) {
        return {
          ...job,
          progress,
          status,
          result: result !== undefined ? result : job.result,
          error: error !== undefined ? error : job.error,
          completedAt: status !== 'running' ? Date.now() : undefined,
        };
      }
      return job;
    });
    saveJobsToStorage(updated);
  };

  const handleClearCompletedJobs = () => {
    const filtered = jobs.filter(job => job.status === 'running');
    saveJobsToStorage(filtered);
  };

  const handleLoadHistoryInput = (item: HistoryItem) => {
    if (validToolIds.includes(item.tool as ToolType)) {
      setActiveTab(item.tool as ToolType);
    }
  };

  const runningJobsCount = jobs.filter(j => j.status === 'running').length;
  const filteredTools = toolsList.filter(tool => tool.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200" id="main-app-shell">
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#121214] border-b border-gray-200 dark:border-[#232326] px-4 lg:px-6 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E1E20] text-gray-600 dark:text-[#9CA3AF] lg:hidden focus:outline-none"
            id="mobile-menu-trigger"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-[#3B82F6] p-1.5 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
            </div>
            <h1 className="text-base lg:text-lg font-bold tracking-tight text-gray-900 dark:text-[#E1E1E6]">
              DevForge <span className="text-gray-500 dark:text-[#6B7280] font-normal">Utilities</span>
            </h1>
          </div>

          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E1E20] text-gray-600 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-[#E1E1E6] focus:outline-none transition-colors"
            title={sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {sidebarExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* Search input in header */}
        <div className="relative hidden md:block max-w-xs w-full mx-4">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-100 dark:bg-[#1E1E20] border border-gray-200 dark:border-[#2D2D30] text-sm text-gray-900 dark:text-[#E1E1E6] placeholder-gray-500 dark:placeholder-[#6B7280] rounded-full px-4 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-colors"
          />
          {searchQuery && (() => {
            const matches = getSearchMatches(searchQuery);
            return (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#2D2D30] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {matches.map(tool => {
                  const catName = categories.find(c => c.id === tool.category)?.name || '';
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTab(tool.id as ToolType);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#1E1E20] text-sm text-gray-700 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-[#E1E1E6] flex items-center justify-between transition-colors"
                    >
                      <span>{tool.name}</span>
                      {catName && (
                        <span className="text-[9px] bg-gray-100 dark:bg-[#1E1E20] text-gray-500 dark:text-[#6B7280] px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#2D2D30] uppercase tracking-wider">
                          {catName}
                        </span>
                      )}
                    </button>
                  );
                })}
                {matches.length === 0 && (
                  <div className="px-4 py-3 text-xs text-gray-500 dark:text-[#6B7280]">No tools match "{searchQuery}"</div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/loganathan-sekaran/devforge-utilities"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#1E1E20] border border-gray-200 dark:border-[#2D2D30] text-gray-700 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-[#E1E1E6] text-xs transition-all font-medium"
            title="Open Source GitHub Repository"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          <a
            href="https://github.com/loganathan-sekaran/devforge-utilities/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/20 text-xs transition-all font-bold"
            title="Report an issue on GitHub"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Issue</span>
          </a>

          <button
            onClick={() => setJobsOpen(!jobsOpen)}
            className={`relative p-2 rounded-xl transition-all ${
              jobsOpen || runningJobsCount > 0
                ? 'bg-gray-100 dark:bg-[#1E1E20] text-[#3B82F6] border border-gray-200 dark:border-[#2D2D30]'
                : 'bg-gray-100 dark:bg-[#1E1E20] border border-gray-200 dark:border-[#2D2D30] text-gray-600 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-[#E1E1E6]'
            }`}
            title="Background progressive jobs tracker"
            id="header-jobs-btn"
          >
            <Zap className={`w-4 h-4 ${runningJobsCount > 0 ? 'animate-pulse text-[#3B82F6]' : ''}`} />
            {runningJobsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#3B82F6] text-white font-bold text-[9px] flex items-center justify-center animate-bounce">
                {runningJobsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className={`p-2 rounded-xl bg-gray-100 dark:bg-[#1E1E20] border border-gray-200 dark:border-[#2D2D30] text-gray-600 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-[#E1E1E6] transition-all ${
              historyOpen ? 'ring-2 ring-[#3B82F6] text-[#3B82F6]' : ''
            }`}
            title="Global operations logs"
            id="header-history-btn"
          >
            <Clock className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-[#2D2D30] mx-1" />

          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-[#1E1E20] border border-gray-200 dark:border-[#2D2D30] text-gray-600 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-[#E1E1E6] transition-all"
            title="Toggle Theme"
            id="header-theme-btn"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
          </button>
        </div>
      </header>

      {/* Horizontal categories navigation */}
      <nav className="flex gap-6 px-6 bg-white dark:bg-[#121214] border-b border-gray-200 dark:border-[#232326] overflow-x-auto sticky top-[57px] z-30 transition-colors">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const catTools = toolsList.filter(t => t.category === cat.id);
                if (catTools.length > 0) {
                  setActiveTab(catTools[0].id as ToolType);
                }

                // Show side menu by default on selecting category
                setSidebarExpanded(true);
                autoCollapseActiveRef.current = true;

                // Clear any existing collapse timers
                if (sidebarTimerRef.current) {
                  clearTimeout(sidebarTimerRef.current);
                  sidebarTimerRef.current = null;
                }

                // If not currently hovering, start the auto-collapse timer (5 seconds)
                if (!isHoveringSidebar) {
                  sidebarTimerRef.current = setTimeout(() => {
                    if (autoCollapseActiveRef.current) {
                      setSidebarExpanded(false);
                      autoCollapseActiveRef.current = false;
                    }
                  }, 5000);
                }
              }}
              className={`py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap focus:outline-none ${
                isActive
                  ? 'border-[#3B82F6] text-[#3B82F6]'
                  : 'border-transparent text-gray-500 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-[#E1E1E6]'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </nav>

      {/* Main Content Layout Container */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left Navigation Sidebar */}
        <aside
          onMouseEnter={() => {
            setIsHoveringSidebar(true);
            if (sidebarTimerRef.current) {
              clearTimeout(sidebarTimerRef.current);
              sidebarTimerRef.current = null;
            }
          }}
          onMouseLeave={() => {
            setIsHoveringSidebar(false);
            if (autoCollapseActiveRef.current) {
              // User left the sidebar; start a quick 3-second collapse timer
              if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
              sidebarTimerRef.current = setTimeout(() => {
                if (autoCollapseActiveRef.current) {
                  setSidebarExpanded(false);
                  autoCollapseActiveRef.current = false;
                }
              }, 3000);
            }
          }}
          className={`lg:block fixed lg:sticky top-[109px] bottom-0 left-0 bg-white dark:bg-[#0E0E10] border-r border-gray-200 dark:border-[#232326] z-30 transform lg:transform-none transition-all duration-200 ease-in-out ${
            sidebarExpanded ? 'w-56' : 'lg:w-16 w-0 lg:opacity-100 opacity-0 lg:translate-x-0 -translate-x-full'
          } ${
            mobileMenuOpen ? 'translate-x-0 w-56 opacity-100' : '-translate-x-full lg:translate-x-0'
          }`}
          id="aside-sidebar"
        >
          <div className="h-full flex flex-col justify-between py-4 overflow-x-hidden">
            <div className="space-y-4">
              <div className={`px-4 mb-2 text-[10px] uppercase font-bold text-gray-400 dark:text-[#4B5563] tracking-widest truncate ${!sidebarExpanded && 'lg:text-center'}`}>
                {sidebarExpanded ? 'Available Tools' : 'Tools'}
              </div>

              <nav className="flex flex-col" id="sidebar-tools-list">
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setMobileMenuOpen(false);
                    // Tool is selected/used, so cancel the auto-collapse
                    autoCollapseActiveRef.current = false;
                    if (sidebarTimerRef.current) {
                      clearTimeout(sidebarTimerRef.current);
                      sidebarTimerRef.current = null;
                    }
                  }}
                  title={!sidebarExpanded ? "All Utilities (Home)" : undefined}
                  className={`flex items-center text-sm transition-colors text-left focus:outline-none ${
                    sidebarExpanded 
                      ? 'gap-3 px-4 py-2.5' 
                      : 'lg:justify-center lg:px-0 py-3 gap-0 px-4'
                  } ${
                    activeTab === 'home'
                      ? 'bg-blue-50 dark:bg-[#1E1E20] text-[#3B82F6] font-medium border-r-2 border-[#3B82F6]'
                      : 'text-gray-600 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-[#151518] hover:text-gray-900 dark:hover:text-[#E1E1E6]'
                  }`}
                >
                  <Home className="w-4 h-4 shrink-0" />
                  <span className={`${sidebarExpanded ? 'block' : 'lg:hidden block'} truncate`}>Dashboard Home</span>
                </button>
                <div className="h-px bg-gray-200 dark:bg-[#232326] my-2 mx-4" />
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTab(tool.id as ToolType);
                        setMobileMenuOpen(false);
                        // Tool is selected/used, so cancel the auto-collapse
                        autoCollapseActiveRef.current = false;
                        if (sidebarTimerRef.current) {
                          clearTimeout(sidebarTimerRef.current);
                          sidebarTimerRef.current = null;
                        }
                      }}
                      title={!sidebarExpanded ? tool.name : undefined}
                      className={`flex items-center text-sm transition-colors text-left focus:outline-none ${
                        sidebarExpanded 
                          ? 'gap-3 px-4 py-2.5' 
                          : 'lg:justify-center lg:px-0 py-3 gap-0 px-4'
                      } ${
                        isActive
                          ? 'bg-blue-50 dark:bg-[#1E1E20] text-[#3B82F6] font-medium border-r-2 border-[#3B82F6]'
                          : 'text-gray-600 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-[#151518] hover:text-gray-900 dark:hover:text-[#E1E1E6]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className={`${sidebarExpanded ? 'block' : 'lg:hidden block'} truncate`}>{tool.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Recent Activity Section */}
            {sidebarExpanded && (
              <div className="p-4 mt-auto">
                <div className="bg-gray-50 dark:bg-[#1E1E20] p-3 rounded-lg border border-gray-200 dark:border-[#2D2D30]">
                  <div className="text-[10px] text-gray-500 dark:text-[#9CA3AF] uppercase mb-2">Recent Activity</div>
                  {history.length > 0 ? (
                    <ul className="space-y-2 text-xs">
                      {history.slice(0, 3).map((item) => (
                        <li key={item.id} className="flex items-center justify-between text-gray-600 dark:text-[#6B7280]">
                          <span className="truncate max-w-[110px]">{toolsList.find(t => t.id === item.tool)?.name || item.tool}</span>
                          <span className="text-[8px] shrink-0">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-[10px] text-gray-400 dark:text-zinc-650">No recent activity</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/30 lg:hidden z-20 backdrop-blur-sm"
            id="mobile-backdrop"
          />
        )}

        {/* Main interactive content deck */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full overflow-hidden" id="active-tool-viewport">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-xs">
            {activeTab === 'home' && (
              <HomeTool
                onSelectTool={(id) => setActiveTab(id)}
                onSelectCategory={(catId) => {
                  setActiveCategory(catId);
                  const catTools = toolsList.filter(t => t.category === catId);
                  if (catTools.length > 0) {
                    setActiveTab(catTools[0].id as ToolType);
                  }
                }}
              />
            )}
            {activeTab === 'json' && (
              <JSONTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'json')}
              />
            )}
            {activeTab === 'sql' && (
              <SqlTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'sql')}
              />
            )}
            {activeTab === 'base64' && (
              <Base64UrlTool
                forceMode="base64"
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'base64')}
              />
            )}
            {activeTab === 'url' && (
              <Base64UrlTool
                forceMode="url"
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'url')}
              />
            )}
            {activeTab === 'escaper' && (
              <EscaperTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'escaper')}
              />
            )}
            {activeTab === 'jwt' && (
              <JWTTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'jwt')}
              />
            )}
            {activeTab === 'pem' && (
              <PemTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'pem')}
              />
            )}
            {activeTab === 'hash' && (
              <HashTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'hash')}
                onAddJob={handleAddJob}
                onUpdateJobProgress={handleUpdateJobProgress}
              />
            )}
            {activeTab === 'chmod' && (
              <ChmodTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'chmod')}
              />
            )}
            {activeTab === 'timestamp' && (
              <TimestampTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'timestamp')}
              />
            )}
            {activeTab === 'cron' && (
              <CronTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'cron')}
              />
            )}
            {activeTab === 'regex' && (
              <RegexTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'regex')}
              />
            )}
            {activeTab === 'markdown' && (
              <MarkdownTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'markdown')}
              />
            )}
            {activeTab === 'uuid' && (
              <UUIDTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'uuid')}
                onAddJob={handleAddJob}
                onUpdateJobProgress={handleUpdateJobProgress}
              />
            )}
            {activeTab === 'diff' && (
              <DiffTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'diff')}
              />
            )}
            {activeTab === 'color' && (
              <ColorTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'color')}
              />
            )}
            {activeTab === 'rest' && (
              <RestNetworkTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'rest')}
              />
            )}
            {activeTab === 'curl' && (
              <CurlTool
                onSaveHistory={handleSaveHistory}
                history={history.filter(h => h.tool === 'curl')}
              />
            )}
          </div>

          {/* Privacy Disclaimer & Local Storage Clear Panel */}
          <footer className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-5 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#232326] shadow-xs">
            <div className="flex items-start gap-3 max-w-2xl">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-xs text-gray-800 dark:text-zinc-200">
                  Secure Client-Side Sandbox & Privacy Assurance
                </span>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  All transcoding and text manipulation tools operate entirely within your browser. Content pasted, files uploaded, and keys processed on this website are <strong>never sent to, logged by, or preserved on any server</strong>. Your proprietary data remains completely private and secure.
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto flex flex-col items-end gap-2">
              {clearSuccess && (
                <span className="text-[10px] text-emerald-500 font-semibold animate-pulse">
                  ✓ Local storage cleared successfully!
                </span>
              )}
              {clearConfirm ? (
                <div className="flex flex-col gap-2 p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl max-w-[280px]">
                  <div className="flex gap-1.5 items-start">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-red-800 dark:text-red-400 font-semibold leading-relaxed">
                      This will permanently delete all cached history, background tasks, and custom preferences.
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      onClick={() => setClearConfirm(false)}
                      className="px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        setHistory([]);
                        setJobs([]);
                        setClearConfirm(false);
                        setClearSuccess(true);
                        setTimeout(() => setClearSuccess(false), 4000);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-all shadow-sm"
                    >
                      Yes, purge all
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setClearConfirm(true)}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 dark:border-red-900/40 hover:border-red-300 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-lg transition-colors font-medium text-xs shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Local-Storage Content
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>

      {/* Flyout Sidebars */}
      <GlobalHistoryPanel
        history={history}
        onClearHistory={handleClearHistory}
        onRemoveHistoryItem={handleRemoveHistoryItem}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadHistoryInput={handleLoadHistoryInput}
      />

      <JobsTracker
        jobs={jobs}
        onClearCompleted={handleClearCompletedJobs}
        isOpen={jobsOpen}
        onClose={() => setJobsOpen(false)}
      />
    </div>
  );
}
