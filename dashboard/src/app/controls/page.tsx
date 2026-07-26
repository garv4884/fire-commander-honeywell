'use client';

import React, { useEffect, useState } from 'react';
import { fireSimulator } from '../../lib/fire-simulator';
import { Shield, Fan, Lock, Unlock, AlertTriangle, CheckCircle2, BellOff, Bell, Power, Thermometer, Wind } from 'lucide-react';
import type { SensorReading } from '../../core/types';
import { classifyHazard } from '../../core/sensor-fusion';
import { useMapStore } from '../../core/MapContext';
import { cn } from '../../lib/utils';

interface ZoneOverride {
  hvacForcedOff: boolean;
  doorsForceUnlocked: boolean;
  alarmSuppressed: boolean;
}

const ZONES = [
  {
    id: 'north',
    name: 'North Wing',
    description: 'Floor 1 & 2 Office Spaces',
    nodeIds: ['F1_A1', 'F1_A2', 'F1_A3', 'F1_A4', 'F2_D1', 'F2_D2', 'F2_D3', 'F2_D4'],
    color: 'blue',
  },
  {
    id: 'south',
    name: 'South Wing',
    description: 'Floor 1 Service & Storage',
    nodeIds: ['F1_B1', 'F1_B2', 'F1_B3', 'F1_B4'],
    color: 'orange',
  },
  {
    id: 'core',
    name: 'Central Core',
    description: 'Hallways & Stairwells',
    nodeIds: ['F1_H1', 'F1_H2', 'F1_H3', 'F1_STAIR_W', 'F2_H1', 'F2_H2', 'F2_H3', 'F2_STAIR_W'],
    color: 'purple',
  },
  {
    id: 'floor2',
    name: 'Floor 2 Labs',
    description: 'Floor 2 South Offices',
    nodeIds: ['F2_E1', 'F2_E2', 'F2_E3'],
    color: 'teal',
  },
];

type ZoneStatus = 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER' | 'BLOCKED';
const STATUS_COLOR: Record<ZoneStatus, string> = {
  SAFE: 'text-emerald-500',
  CAUTION: 'text-yellow-500',
  WARNING: 'text-amber-500',
  DANGER: 'text-red-500',
  BLOCKED: 'text-red-700',
};

export default function ControlsPage() {
  const { nodes } = useMapStore();
  const [readings, setReadings] = useState<Map<string, SensorReading>>(new Map());
  const [overrides, setOverrides] = useState<Record<string, ZoneOverride>>(() =>
    Object.fromEntries(ZONES.map(z => [z.id, { hvacForcedOff: false, doorsForceUnlocked: false, alarmSuppressed: false }]))
  );

  useEffect(() => {
    setReadings(new Map(fireSimulator.getCurrentReadings()));
    fireSimulator.onSensorUpdate(r => setReadings(new Map(r)));
  }, []);

  const getZoneData = (nodeIds: string[]) => {
    const zoneReadings = nodeIds.map(id => readings.get(id)).filter(Boolean) as SensorReading[];
    if (zoneReadings.length === 0) return { status: 'SAFE' as ZoneStatus, maxSmoke: 0, maxTemp: 25, hasFire: false, totalOccupancy: 0, nodeData: [] as { id: string; label: string; reading: SensorReading }[] };

    let maxSmoke = 0, maxTemp = 0, totalOccupancy = 0;
    let hasFire = false;
    let worstStatus: ZoneStatus = 'SAFE';
    const levels: ZoneStatus[] = ['SAFE', 'CAUTION', 'WARNING', 'DANGER', 'BLOCKED'];

    const nodeData = nodeIds.map(id => {
      const r = readings.get(id);
      const node = nodes.find(n => n.id === id);
      if (r) {
        maxSmoke = Math.max(maxSmoke, r.smokePpm);
        maxTemp = Math.max(maxTemp, r.temperature);
        totalOccupancy += r.occupancy;
        if (r.flameDetected) hasFire = true;
        const s = classifyHazard(r);
        if (levels.indexOf(s) > levels.indexOf(worstStatus)) worstStatus = s;
      }
      return { id, label: node?.label ?? id, reading: r ?? { nodeId: id, timestamp: 0, temperature: 25, smokePpm: 0, flameDetected: false, occupancy: 0 } };
    });

    return { status: worstStatus, maxSmoke, maxTemp, hasFire, totalOccupancy, nodeData };
  };

  const setOverride = (zoneId: string, key: keyof ZoneOverride, value: boolean) => {
    setOverrides(prev => ({ ...prev, [zoneId]: { ...prev[zoneId], [key]: value } }));
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10 pt-4 md:pt-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">Building Controls</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Live HVAC management and magnetic fire door controls. Override states persist during the session.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] text-xs font-bold text-[var(--color-muted)]">
          <Shield size={14} /> ADMIN ACCESS ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ZONES.map((zone, i) => {
          const { status, maxSmoke, maxTemp, hasFire, totalOccupancy, nodeData } = getZoneData(zone.nodeIds);
          const ov = overrides[zone.id];
          const isAutoDanger = status === 'DANGER' || status === 'BLOCKED';
          const hvacOff = isAutoDanger || ov.hvacForcedOff;
          const doorsOpen = isAutoDanger || ov.doorsForceUnlocked;
          const alarmActive = isAutoDanger && !ov.alarmSuppressed;

          return (
            <div key={zone.id} className={cn('card-md p-6 fade-up flex flex-col gap-4 transition-all duration-500', isAutoDanger && !ov.alarmSuppressed && 'ring-1 ring-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]')} style={{ animationDelay: `${i * 0.1}s` }}>
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-fg)]">{zone.name}</h2>
                  <p className="text-[11px] text-[var(--color-muted)]">{zone.description}</p>
                </div>
                <div className={cn('flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border', {
                  'text-emerald-500 border-emerald-500/30 bg-emerald-500/10': status === 'SAFE',
                  'text-yellow-500 border-yellow-500/30 bg-yellow-500/10': status === 'CAUTION',
                  'text-amber-500 border-amber-500/30 bg-amber-500/10': status === 'WARNING',
                  'text-red-500 border-red-500/30 bg-red-500/10 animate-pulse': status === 'DANGER' || status === 'BLOCKED',
                })}>
                  {hasFire ? '🔥' : <CheckCircle2 size={12} />}
                  {status}
                </div>
              </div>

              {/* Live node breakdown */}
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--color-panel-2)] border-b border-[var(--color-border)] flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  <span>Zone Nodes</span>
                  <span className="flex items-center gap-2">
                    <Thermometer size={10} /> Temp
                    <Wind size={10} className="ml-1" /> Smoke
                  </span>
                </div>
                <div className="divide-y divide-[var(--color-border)] max-h-[140px] overflow-y-auto">
                  {nodeData.map(({ id, label, reading }) => {
                    const nodeStatus = classifyHazard(reading);
                    const barPct = Math.min(100, (reading.smokePpm / 800) * 100);
                    const tempPct = Math.min(100, ((reading.temperature - 25) / 125) * 100);
                    return (
                      <div key={id} className="px-3 py-2 flex items-center gap-3 text-xs">
                        <div className={cn('h-2 w-2 rounded-full shrink-0', {
                          'bg-emerald-500': nodeStatus === 'SAFE',
                          'bg-yellow-500': nodeStatus === 'CAUTION',
                          'bg-amber-500': nodeStatus === 'WARNING',
                          'bg-red-500 animate-pulse': nodeStatus === 'DANGER' || nodeStatus === 'BLOCKED',
                        })} />
                        <span className="text-[var(--color-fg)] font-medium min-w-[80px] truncate">{label}</span>
                        <div className="flex-1 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-1 bg-[var(--color-panel-2)] rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 rounded-full transition-all duration-300" style={{ width: `${tempPct}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-[var(--color-muted)] w-12 text-right">{reading.temperature.toFixed(0)}°C</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-1 bg-[var(--color-panel-2)] rounded-full overflow-hidden">
                              <div className="h-full bg-purple-400 rounded-full transition-all duration-300" style={{ width: `${barPct}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-[var(--color-muted)] w-12 text-right">{reading.smokePpm.toFixed(0)} ppm</span>
                          </div>
                        </div>
                        {reading.flameDetected && <span className="text-sm">🔥</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 py-1.5 bg-[var(--color-panel-2)] border-t border-[var(--color-border)] flex justify-between text-[10px] text-[var(--color-muted)]">
                  <span>Peak: {maxTemp.toFixed(0)}°C · {maxSmoke.toFixed(0)} ppm</span>
                  <span>Occupancy: {totalOccupancy}</span>
                </div>
              </div>

              {/* Controls row */}
              <div className="flex flex-col gap-3 pt-2 border-t border-[var(--color-border)]">
                
                {/* HVAC */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fan size={15} className={cn(hvacOff ? 'text-red-500' : 'text-emerald-500 animate-spin-slow')} />
                    <span className="text-sm font-semibold text-[var(--color-fg)]">HVAC System</span>
                    {isAutoDanger && <span className="text-[10px] text-red-500 font-bold">(AUTO)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-bold', hvacOff ? 'text-red-500' : 'text-emerald-500')}>
                      {hvacOff ? 'SHUTDOWN' : 'ACTIVE'}
                    </span>
                    {!isAutoDanger && (
                      <button onClick={() => setOverride(zone.id, 'hvacForcedOff', !ov.hvacForcedOff)}
                        className={cn('relative h-5 w-9 rounded-full transition-colors', ov.hvacForcedOff ? 'bg-red-500' : 'bg-[var(--color-border)]')}>
                        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', ov.hvacForcedOff ? 'translate-x-4' : 'translate-x-0.5')} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fire Doors */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {doorsOpen ? <Unlock size={15} className="text-amber-500" /> : <Lock size={15} className="text-emerald-500" />}
                    <span className="text-sm font-semibold text-[var(--color-fg)]">Magnetic Doors</span>
                    {isAutoDanger && <span className="text-[10px] text-amber-500 font-bold">(AUTO)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-bold', doorsOpen ? 'text-amber-500' : 'text-emerald-500')}>
                      {doorsOpen ? 'UNLOCKED' : 'SECURED'}
                    </span>
                    {!isAutoDanger && (
                      <button onClick={() => setOverride(zone.id, 'doorsForceUnlocked', !ov.doorsForceUnlocked)}
                        className={cn('relative h-5 w-9 rounded-full transition-colors', ov.doorsForceUnlocked ? 'bg-amber-500' : 'bg-[var(--color-border)]')}>
                        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', ov.doorsForceUnlocked ? 'translate-x-4' : 'translate-x-0.5')} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Alarm suppression — only available if auto-triggered */}
                {isAutoDanger && (
                  <div className="flex items-center justify-between bg-[var(--color-panel-2)] rounded-lg px-3 py-2 border border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                      {ov.alarmSuppressed ? <BellOff size={15} className="text-[var(--color-muted)]" /> : <Bell size={15} className="text-red-500 animate-pulse" />}
                      <span className="text-xs font-semibold text-[var(--color-fg)]">Alarm Suppression</span>
                    </div>
                    <button onClick={() => setOverride(zone.id, 'alarmSuppressed', !ov.alarmSuppressed)}
                      className={cn('relative h-5 w-9 rounded-full transition-colors', ov.alarmSuppressed ? 'bg-[var(--color-muted)]' : 'bg-red-500')}>
                      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', ov.alarmSuppressed ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
