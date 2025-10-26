import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import type { StoredCredential } from '../../utils/database';

interface Props {
  credentials: StoredCredential[];
}

function buildResetData(credentials: StoredCredential[]) {
  return credentials.map(c => ({
    name: c.name,
    lastReset: c.lastResetAt ? new Date(c.lastResetAt).getTime() : 0
  }));
}

function buildStrengthData(credentials: StoredCredential[]) {
  return credentials.map(c => ({
    name: c.name,
    strength: Math.min(c.password.ciphertext.length / 32, 1) * 100
  }));
}

export const SecurityCharts: React.FC<Props> = ({ credentials }) => {
  const resetData = buildResetData(credentials).map(entry => ({
    ...entry,
    lastResetDays: entry.lastReset ? Math.round((Date.now() - entry.lastReset) / (1000 * 60 * 60 * 24)) : 999
  }));

  const strengthData = buildStrengthData(credentials);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <h3 className="mb-4 text-sm font-semibold text-slate-400">Password Strength Overview</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={strengthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
            <Bar dataKey="strength" fill="#1F6FEB" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <h3 className="mb-4 text-sm font-semibold text-slate-400">Days Since Last Reset</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={resetData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
            <Line type="monotone" dataKey="lastResetDays" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SecurityCharts;
