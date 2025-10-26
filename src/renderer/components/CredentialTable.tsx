import React from 'react';
import { Switch } from './Switch';
import type { StoredCredential } from '../../utils/database';

interface Props {
  credentials: StoredCredential[];
  onToggleAutoReset: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onTriggerReset: (id: string) => void;
}

export const CredentialTable: React.FC<Props> = ({
  credentials,
  onToggleAutoReset,
  onDelete,
  onTriggerReset
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Account</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Username</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Strength</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Last Reset</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Auto-Reset</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {credentials.map(credential => {
            const strength = Math.min(credential.password.ciphertext.length / 32, 1) * 100;
            return (
              <tr key={credential.id} className="hover:bg-slate-800/40">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-white">{credential.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-300">{credential.username}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-300">{Math.round(strength)}%</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-300">
                  {credential.lastResetAt ? new Date(credential.lastResetAt).toLocaleString() : 'Never'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      credential.breachStatus === 'compromised' ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'
                    }`}
                  >
                    {credential.breachStatus === 'compromised' ? 'Compromised' : 'Safe'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <Switch checked={!!credential.autoReset} onCheckedChange={value => onToggleAutoReset(credential.id, value)} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-right space-x-2">
                  <button
                    onClick={() => onTriggerReset(credential.id)}
                    className="rounded-lg border border-primary/40 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => onDelete(credential.id)}
                    className="rounded-lg border border-danger/40 px-3 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!credentials.length && (
        <div className="p-6 text-center text-sm text-slate-400">No credentials stored yet.</div>
      )}
    </div>
  );
};

export default CredentialTable;
