'use client';

import React, { useEffect, useState } from 'react';
import type { SensorReading } from '../core/types';
import { Flame, Check, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  nodeId: string;
  nodeLabel: string;
  reading: SensorReading | null;
}

function RadialGauge({
  value, max, label, unit, color, size = 80,
}: {
  value: number; max: number; label: string; unit: string; color: string; size?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  // Arc goes from 135° to 45° (270° sweep)
  const arcLen = pct * circumference * 0.75;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={-circumference * 0.375}
          transform={`rotate(135 ${size/2} ${size/2})`}
        />
        {/* Value arc */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference - arcLen}`}
          strokeDashoffset={-circumference * 0.375 + circumference * 0.25 - arcLen + circumference * 0.75 - arcLen}
          transform={`rotate(135 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease' }}
        />
        {/* Value text */}
        <text
          x={size/2} y={size/2 + 4}
          textAnchor="middle"
          fontSize={size < 80 ? 11 : 13}
          fontWeight="700"
          fill="var(--color-fg)"
          fontFamily="var(--font-mono)"
        >
          {Math.round(value)}{unit}
        </text>
      </svg>
      <span className="text-[10px] font-medium text-[var(--color-muted)] -mt-1">{label}</span>
    </div>
  );
}

function getGaugeColor(value: number, type: 'temp' | 'smoke') {
  if (type === 'temp') {
    if (value > 150) return '#dc2626'; // red-600
    if (value > 80)  return '#ef4444'; // red-500
    if (value > 60)  return '#f97316'; // orange-500
    if (value > 40)  return '#eab308'; // yellow-500
    return '#10b981'; // emerald-500
  } else {
    if (value > 800) return '#dc2626';
    if (value > 500) return '#ef4444';
    if (value > 300) return '#f97316';
    if (value > 100) return '#eab308';
    return '#10b981';
  }
}

export default function SensorGauges({ nodeId, nodeLabel, reading }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !reading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-xs text-[var(--color-muted)]">
          Loading sensor data...
        </div>
      </div>
    );
  }

  const tempColor  = getGaugeColor(reading.temperature, 'temp');
  const smokeColor = getGaugeColor(reading.smokePpm, 'smoke');

  // Risk score [0-100] using fusion formula
  const tempNorm  = Math.max(0, Math.min(1, (reading.temperature - 25) / 575));
  const smokeNorm = Math.max(0, Math.min(1, reading.smokePpm / 1000));
  const flameVal  = reading.flameDetected ? 1 : 0;
  const riskScore = Math.min(100, ((2*tempNorm + 3*smokeNorm + 5*flameVal) / 10) * 100);

  return (
    <div className="flex flex-col p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[12px] font-bold text-[var(--color-fg)] tracking-wide">{nodeLabel}</div>
          <div className="text-[10px] font-mono text-[var(--color-muted)]">{nodeId}</div>
        </div>
        {reading.isSimulated && (
          <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
            SIM
          </span>
        )}
      </div>

      {/* Gauges */}
      <div className="flex justify-around items-end gap-1">
        <RadialGauge value={reading.temperature} max={200} label="Temp" unit="°" color={tempColor} />
        <RadialGauge value={reading.smokePpm}    max={1000} label="Smoke" unit="" color={smokeColor} />

        {/* Flame indicator */}
        <div className="flex flex-col items-center">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
            reading.flameDetected 
              ? "border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]" 
              : "border-emerald-500 bg-emerald-500/5 text-emerald-500"
          )}>
            {reading.flameDetected ? <Flame size={20} /> : <Check size={20} />}
          </div>
          <span className="mt-1 text-[10px] font-medium text-[var(--color-muted)]">Flame</span>
        </div>

        {/* Occupancy */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-blue-500/40 bg-blue-500/10">
            <span className="font-mono text-lg font-bold leading-none text-blue-600 dark:text-blue-400">
              {reading.occupancy}
            </span>
          </div>
          <span className="mt-1 text-[10px] font-medium text-[var(--color-muted)] flex items-center gap-1">
            <Users size={10} /> People
          </span>
        </div>
      </div>

      {/* Risk score bar */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Risk Score</span>
          <span className={cn(
            "font-mono text-[11px] font-bold",
            riskScore > 70 ? "text-red-500" : riskScore > 40 ? "text-orange-500" : "text-emerald-500"
          )}>
            {Math.round(riskScore)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${riskScore}%`,
              background: riskScore > 70
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : riskScore > 40
                ? 'linear-gradient(90deg, #f97316, #ea580c)'
                : 'linear-gradient(90deg, #10b981, #059669)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
