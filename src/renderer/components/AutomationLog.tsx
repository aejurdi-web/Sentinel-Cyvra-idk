import React from 'react';
import type { AutomationLogEntry } from '../../automation/passwordResetEngine';

interface Props {
  logs: AutomationLogEntry[];
}

const AutomationLog: React.FC<Props> = ({ logs }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400">Automation Log</h3>
      </div>
      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-2 text-sm">
        {logs.map(log => (
          <div key={log.id} className="rounded-lg border border-slate-800/80 bg-slate-800/60 p-3">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                  log.level === 'error'
                    ? 'bg-danger/20 text-danger'
                    : log.level === 'warn'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {log.level}
              </span>
              <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-slate-200">{log.message}</p>
          </div>
        ))}
        {!logs.length && <p className="text-center text-slate-500">No automation events yet.</p>}
      </div>
    </div>
  );
};

export default AutomationLog;
