'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Plug, Siren, Activity, Map, Server, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  systemMode: 'NORMAL' | 'DEGRADED' | 'ISOLATED' | 'EMERGENCY';
  connectedNodes: string[];
  alertCount: number;
  lastUpdateMs: number;
  activePathCount: number;
  simRunning: boolean;
  simScenario: string | null;
  livesAtRisk?: number;
}

const MODE_CONFIG = {
  NORMAL:    { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-[var(--color-panel)] border-emerald-500/30', label: 'System Normal',  Icon: CheckCircle2 },
  DEGRADED:  { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-[var(--color-panel)] border-amber-500/30', label: 'Degraded', Icon: AlertTriangle },
  ISOLATED:  { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-[var(--color-panel)] border-orange-500/30', label: 'Isolated', Icon: Plug },
  EMERGENCY: { color: 'text-red-600 dark:text-red-400', bg: 'bg-[var(--color-panel)] border-red-500/40', label: 'Emergency', Icon: Siren },
};

const ESP32_NODES = ['node_1', 'node_2', 'node_3'];
const NODE_LABELS: Record<string, string> = {
  node_1: 'N1 Server',
  node_2: 'N2 Hall-1',
  node_3: 'N3 Hall-2',
};

function StatCard({ label, value, sub, icon: Icon, highlightClass }: { label: string; value: string | number; sub?: string; icon: React.ElementType; highlightClass?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-sm p-4 transition-colors hover:border-[var(--color-accent)]/30">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
        <Icon size={14} className="text-[var(--color-muted)]" />
      </div>
      <div className="flex flex-col">
        <span suppressHydrationWarning className={cn("text-2xl font-bold tracking-tight text-[var(--color-fg)]", highlightClass)}>
          {value}
        </span>
        {sub && <span className="text-[10px] font-medium text-[var(--color-muted)] mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

export default function SystemStatus({
  systemMode, connectedNodes, alertCount, lastUpdateMs, activePathCount, simRunning, simScenario, livesAtRisk = 0,
}: Props) {
  const mode = MODE_CONFIG[systemMode] ?? MODE_CONFIG.NORMAL;
  const latencyMs = Date.now() - lastUpdateMs;

  const handleDispatch = () => {
    alert("DISPATCH TRIGGERED: Fire Department and Emergency Medical Services have been notified of the active hazard.");
  };

  return (
    <div className="flex flex-col gap-4 py-1">
      {/* System mode banner */}
      <div className={cn("relative flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-all", mode.bg)}>
        <div className={cn("rounded-lg p-2 bg-[var(--color-panel-2)] shadow-sm", mode.color)}>
          <mode.Icon size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-0.5">Current Status</div>
          <div className={cn("text-base font-bold tracking-tight", mode.color)}>
            {mode.label}
          </div>
        </div>
        {simRunning && (
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">Simulation</div>
            <div className="text-xs font-semibold text-[var(--color-fg)] max-w-[100px] truncate">
              {simScenario ?? 'Active'}
            </div>
          </div>
        )}
        {systemMode === 'EMERGENCY' && (
          <button 
            onClick={handleDispatch}
            className="absolute -bottom-3 right-4 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Dispatch Authorities
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Lives at Risk"
          value={livesAtRisk}
          sub={livesAtRisk > 0 ? 'In Danger Zones' : 'All safe'}
          icon={Activity}
          highlightClass={livesAtRisk > 0 ? 'text-red-500' : ''}
        />
        <StatCard
          label="Active Alerts"
          value={alertCount}
          sub={alertCount > 0 ? 'Zones in danger' : 'All clear'}
          icon={AlertTriangle}
          highlightClass={alertCount > 0 ? 'text-amber-500' : ''}
        />
        <StatCard
          label="Active Paths"
          value={activePathCount}
          sub="Routes computed"
          icon={Map}
          highlightClass="text-[var(--color-accent)]"
        />
        <StatCard
          label="Engine Latency"
          value={latencyMs > 9999 ? 'N/A' : `${latencyMs}ms`}
          sub="Since last tick"
          icon={Clock}
        />
        <StatCard
          label="Mesh Network"
          value={`${connectedNodes.length}/${ESP32_NODES.length}`}
          sub="Nodes online"
          icon={Server}
          highlightClass={connectedNodes.length === ESP32_NODES.length ? 'text-emerald-500' : 'text-amber-500'}
        />
      </div>

      {/* Node connectivity */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-sm p-4">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center justify-between">
          <span>ESP32 Hardware Nodes</span>
          <Activity size={14} />
        </div>
        <div className="flex gap-2">
          {ESP32_NODES.map(nodeId => {
            const online = connectedNodes.includes(nodeId);
            return (
              <div key={nodeId} className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors",
                online ? "border-emerald-500/30 bg-[var(--color-panel)]" : "border-[var(--color-border)] bg-[var(--color-panel)]"
              )}>
                <div className={cn("h-2.5 w-2.5 rounded-full mt-0.5 mb-0.5", online ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
                <div className={cn("text-[10px] font-bold tracking-wide", online ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--color-muted)]")}>
                  {NODE_LABELS[nodeId]}
                </div>
                <div className="text-[9px] font-medium text-[var(--color-muted)] uppercase tracking-wider">{online ? 'Online' : 'Offline'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
