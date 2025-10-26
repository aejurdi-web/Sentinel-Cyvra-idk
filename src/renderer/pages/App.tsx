import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useCredentials, useAutomationLogs } from '../hooks/useSentinel';
import StatsCards from '../components/StatsCards';
import CredentialTable from '../components/CredentialTable';
import SecurityCharts from '../components/SecurityCharts';
import AutomationLog from '../components/AutomationLog';
import AssistantPanel from '../components/AssistantPanel';

const App: React.FC = () => {
  const { listQuery, saveCredential, deleteCredential, exportVault, importVault } = useCredentials();
  const { data: logs } = useAutomationLogs();
  const [locked, setLocked] = useState(false);

  const { data: credentialsData, refetch } = listQuery;

  useEffect(() => {
    window.sentinel.onVaultLock(() => setLocked(true));
    window.sentinel.onResetComplete(() => refetch());
  }, [refetch]);

  const credentials = useMemo(() => credentialsData ?? [], [credentialsData]);

  const toggleAutoReset = async (id: string, enabled: boolean) => {
    const credential = credentials.find(item => item.id === id);
    if (!credential) return;
    await saveCredential({
      id: credential.id,
      name: credential.name,
      username: credential.username,
      breachStatus: credential.breachStatus,
      lastResetAt: credential.lastResetAt,
      autoReset: enabled ? 1 : 0,
      createdAt: credential.createdAt
    });
  };

  const handleDelete = async (id: string) => {
    await deleteCredential(id);
  };

  const handleTriggerReset = async (id: string) => {
    await window.sentinel.triggerReset(id);
  };

  const handleAddMock = async () => {
    await saveCredential({
      id: uuid(),
      name: 'GitHub',
      username: 'dev@example.com',
      password: 'ExamplePassword!123',
      breachStatus: 'safe',
      lastResetAt: new Date().toISOString(),
      autoReset: 1,
      notes: 'Sample data'
    });
  };

  const unlockVault = async () => {
    const success = await window.sentinel.unlock();
    setLocked(!success);
  };

  useEffect(() => {
    const activityHandler = () => window.sentinel.notifyActivity();
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keydown', activityHandler);
    return () => {
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
    };
  }, []);

  if (locked) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-center text-white">
        <h1 className="text-2xl font-bold">Vault Locked</h1>
        <p className="mt-2 max-w-sm text-slate-400">
          Sentinel locked due to inactivity. Authenticate with your biometric device to continue.
        </p>
        <button onClick={unlockVault} className="mt-6 rounded-lg bg-primary px-6 py-2 text-white">
          Unlock
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Sentinel Security Dashboard</h1>
            <p className="text-sm text-slate-400">Proactive password automation and AI-driven insights.</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={handleAddMock}
              className="rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/10"
            >
              Add Sample Data
            </button>
            <button
              onClick={() => exportVault()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Export
            </button>
            <button
              onClick={() => importVault()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Import
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <StatsCards credentials={credentials} />
        <SecurityCharts credentials={credentials} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <CredentialTable
              credentials={credentials}
              onToggleAutoReset={toggleAutoReset}
              onDelete={handleDelete}
              onTriggerReset={handleTriggerReset}
            />
            <AutomationLog logs={logs ?? []} />
          </div>
          <div className="lg:col-span-1">
            <AssistantPanel credentials={credentials} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
