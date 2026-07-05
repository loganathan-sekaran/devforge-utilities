import React from 'react';
import { Loader, CheckCircle2, XCircle, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { BackgroundJob } from '../types';

interface JobsTrackerProps {
  jobs: BackgroundJob[];
  onClearCompleted: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobsTracker({ jobs, onClearCompleted, isOpen, onClose }: JobsTrackerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white dark:bg-zinc-950 shadow-2xl border-l border-gray-100 dark:border-zinc-850 z-50 flex flex-col transition-all duration-300" id="jobs-tracker-sidebar">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-100 dark:border-zinc-850 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Background Jobs
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">Monitor running cryptographic & generation tasks</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Jobs list body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/10 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                      {job.name}
                    </span>
                    <div className="text-[10px] text-gray-400 dark:text-zinc-500">
                      Started {new Date(job.startedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {job.status === 'running' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <Loader className="w-2.5 h-2.5 animate-spin" />
                        Running ({job.progress}%)
                      </span>
                    )}
                    {job.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Completed
                      </span>
                    )}
                    {job.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                        <XCircle className="w-2.5 h-2.5" />
                        Failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.status === 'failed'
                        ? 'bg-red-500'
                        : job.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500 animate-pulse'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>

                {/* Job results/meta block */}
                {job.result && job.tool === 'hash' && (
                  <div className="p-2.5 rounded bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-850 font-mono text-[10px] text-gray-600 dark:text-zinc-400 break-all space-y-1">
                    <div className="text-[9px] uppercase font-bold text-gray-400">Hash Results:</div>
                    <div><span className="font-semibold text-gray-500">MD5:</span> {job.result.md5}</div>
                    <div><span className="font-semibold text-gray-500">SHA256:</span> {job.result.sha256}</div>
                  </div>
                )}

                {job.result && job.tool === 'uuid' && (
                  <div className="p-2.5 rounded bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-850 font-mono text-[10px] text-gray-600 dark:text-zinc-400 break-all">
                    Generated <span className="font-bold text-amber-500">{job.result.length.toLocaleString()}</span> UUID v4 tokens to editor board.
                  </div>
                )}

                {job.error && (
                  <div className="p-2 rounded bg-red-50/50 dark:bg-red-950/20 text-[10px] text-red-500 font-mono">
                    Error: {job.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-zinc-500 mt-20">
            <ShieldCheck className="w-10 h-10 mb-2 stroke-1" />
            <p className="text-sm font-medium">No background jobs listed</p>
            <p className="text-xs max-w-xs mt-1">
              Start operations like bulk UUID generations or large file hashes to trigger offline progress updates here.
            </p>
          </div>
        )}
      </div>

      {/* Footer controls */}
      {jobs.length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-zinc-950/50 flex gap-2">
          <button
            onClick={onClearCompleted}
            className="w-full py-2.5 inline-flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Completed Jobs
          </button>
        </div>
      )}
    </div>
  );
}
