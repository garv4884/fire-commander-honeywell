'use client';

import React, { useState } from 'react';
import type { SimulationState } from '../core/types';
import { PRESET_SCENARIOS } from '../lib/fire-simulator';
import { useMapStore } from '../core/MapContext';
import { Play, Pause, Square, Zap, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  simState: SimulationState;
  onPlay: (scenarioId: string | null, speed: number) => void;
  onPause: () => void;
  onStop: () => void;
  onManualOverride: (nodeId: string, values: Record<string, number | boolean>) => void;
  onClearOverride: (nodeId: string) => void;
  onClearAllOverrides: () => void;
}

export default function SimulationControls({
  simState, onPlay, onPause, onStop, onManualOverride, onClearOverride, onClearAllOverrides,
}: Props) {
  const { nodes: BUILDING_NODES } = useMapStore();
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1);
  const [injectNode, setInjectNode] = useState<string>(BUILDING_NODES.find(n => !n.isExit)?.id ?? '');
  const [injectTemp, setInjectTemp] = useState<number>(25);
  const [injectSmoke, setInjectSmoke] = useState<number>(0);
  const [injectFlame, setInjectFlame] = useState<boolean>(false);

  const handleInject = () => {
    if (!injectNode) return;
    onManualOverride(injectNode, {
      temperature: injectTemp,
      smokePpm: injectSmoke,
      flameDetected: injectFlame,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top controls section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Playback & Scenarios */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 size={16} className="text-[var(--color-muted)]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Scenario Control</span>
          </div>
          
          <select
            value={selectedScenario}
            onChange={e => setSelectedScenario(e.target.value)}
            disabled={simState.isRunning || simState.currentTimeMs > 0}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50 transition-all"
          >
            <option value="">Select a preset scenario...</option>
            {PRESET_SCENARIOS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-[var(--color-muted)] min-w-[60px]">Speed: {speed}x</span>
            <input
              type="range"
              min="0.5" max="5" step="0.5"
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              disabled={simState.isRunning}
              className="flex-1"
            />
          </div>

          <div className="flex gap-3 mt-2">
            {!simState.isRunning ? (
              <button
                onClick={() => onPlay(selectedScenario || null, speed)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-3 text-sm font-bold shadow-sm transition-colors"
              >
                <Play size={16} fill="currentColor" /> Play
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white p-3 text-sm font-bold shadow-sm transition-colors"
              >
                <Pause size={16} fill="currentColor" /> Pause
              </button>
            )}
            <button
              onClick={onStop}
              disabled={!simState.isRunning && simState.currentTimeMs === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-panel-2)] hover:bg-[var(--color-border)] text-[var(--color-fg)] border border-[var(--color-border)] p-3 text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              <Square size={16} fill="currentColor" /> Stop
            </button>
          </div>

          {/* Progress bar */}
          {simState.scenario && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] font-mono text-[var(--color-muted)]">
                <span>T+{(simState.currentTimeMs / 1000).toFixed(1)}s</span>
                <span>{simState.scenario.name}</span>
                <span>{(simState.scenario.durationMs / 1000).toFixed(0)}s total</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-panel-2)] border border-[var(--color-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-100"
                  style={{ width: `${Math.min(100, (simState.currentTimeMs / simState.scenario.durationMs) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Manual Injection */}
        <div className="flex flex-col gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-red-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-500">Manual Fault Injection</span>
          </div>

          <select
            value={injectNode}
            onChange={e => setInjectNode(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-sm text-[var(--color-fg)] outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
          >
            {BUILDING_NODES.filter(n => !n.isExit).map(n => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--color-fg)]">Temp: {injectTemp}°C</span>
              <input
                type="range"
                min="20" max="300" step="5"
                value={injectTemp}
                onChange={e => setInjectTemp(parseInt(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--color-fg)]">Smoke: {injectSmoke} ppm</span>
              <input
                type="range"
                min="0" max="2000" step="50"
                value={injectSmoke}
                onChange={e => setInjectSmoke(parseInt(e.target.value))}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={injectFlame}
              onChange={e => setInjectFlame(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-semibold text-[var(--color-fg)]">Flame Detected</span>
          </label>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleInject}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white p-3 text-[11px] uppercase tracking-wider font-bold shadow-sm transition-colors"
            >
              Inject Fault
            </button>
            <button
              onClick={() => onClearOverride(injectNode)}
              className="flex-1 rounded-xl bg-[var(--color-panel)] hover:bg-[var(--color-border)] text-[var(--color-fg)] border border-[var(--color-border)] p-3 text-[11px] uppercase tracking-wider font-bold shadow-sm transition-colors"
            >
              Clear This
            </button>
            <button
              onClick={() => onClearAllOverrides()}
              className="flex-1 rounded-xl bg-[var(--color-panel)] hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500 text-[var(--color-fg)] border border-[var(--color-border)] p-3 text-[11px] uppercase tracking-wider font-bold shadow-sm transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
