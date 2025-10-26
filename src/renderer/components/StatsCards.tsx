import React from 'react';
import type { StoredCredential } from '../../utils/database';

interface Props {
  credentials: StoredCredential[];
}

function averageStrength(credentials: StoredCredential[]) {
  if (!credentials.length) return 0;
  const score = credentials.reduce((acc, credential) => {
    const lengthScore = Math.min(credential.password.ciphertext.length / 32, 1);
    const varietyScore = credential.username.includes('@') ? 0.5 : 0.3;
    return acc + (lengthScore + varietyScore) / 2;
  }, 0);
  return Math.round((score / credentials.length) * 100);
}

export const StatsCards: React.FC<Props> = ({ credentials }) => {
  const compromised = credentials.filter(c => c.breachStatus === 'compromised').length;
  const autoReset = credentials.filter(c => c.autoReset).length;
  const avgStrength = averageStrength(credentials);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow">
        <h3 className="text-sm font-semibold text-slate-400">Accounts</h3>
        <p className="text-3xl font-bold text-white">{credentials.length}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow">
        <h3 className="text-sm font-semibold text-slate-400">Average Strength</h3>
        <p className="text-3xl font-bold text-white">{avgStrength}%</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow">
        <h3 className="text-sm font-semibold text-slate-400">Auto-Reset Enabled</h3>
        <p className="text-3xl font-bold text-white">{autoReset}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow">
        <h3 className="text-sm font-semibold text-slate-400">Compromised</h3>
        <p className={`text-3xl font-bold ${compromised ? 'text-danger' : 'text-success'}`}>{compromised}</p>
      </div>
    </div>
  );
};

export default StatsCards;
