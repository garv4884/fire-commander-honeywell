'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { SimulationState, SensorReading } from '../../core/types';
import { fireSimulator, PRESET_SCENARIOS } from '../../lib/fire-simulator';
import SimulationControls from '../../components/SimulationControls';
import { useRouter } from 'next/navigation';
// unused

export default function SimulatePage() {
  const router = useRouter();
  const [simState, setSimState] = useState<SimulationState>({
    isRunning: false, scenario: null, currentTimeMs: 0, speedMultiplier: 1, manualOverrides: new Map(),
  });
  
  useEffect(() => {
    fireSimulator.onSensorUpdate((readings) => {
      setSimState(fireSimulator.getState());
    });
    // Initial state
    setSimState(fireSimulator.getState());
  }, []);

  const handlePlay = useCallback((scenarioId: string | null, speed: number) => {
    if (scenarioId) {
      const scenario = PRESET_SCENARIOS.find(s => s.id === scenarioId);
      if (scenario) fireSimulator.loadScenario(scenario);
    }
    fireSimulator.play(speed);
    setSimState({ ...fireSimulator.getState() });
    router.push('/');
  }, [router]);

  const handlePause = useCallback(() => {
    fireSimulator.pause();
    setSimState({ ...fireSimulator.getState() });
  }, []);

  const handleStop = useCallback(() => {
    fireSimulator.clearAllManualOverrides();
    fireSimulator.stop();
    setSimState({ ...fireSimulator.getState() });
  }, []);

  const handleManualOverride = useCallback((nodeId: string, values: Record<string, number | boolean>) => {
    fireSimulator.setManualOverride(nodeId, values as Partial<SensorReading>);
    setSimState({ ...fireSimulator.getState() });
    router.push('/');
  }, [router]);

  const handleClearOverride = useCallback((nodeId: string) => {
    fireSimulator.clearManualOverride(nodeId);
    setSimState({ ...fireSimulator.getState() });
    router.push('/');
  }, [router]);

  const handleClearAllOverrides = useCallback(() => {
    fireSimulator.clearAllManualOverrides();
    setSimState({ ...fireSimulator.getState() });
    router.push('/');
  }, [router]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">Fire Simulator</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Inject synthetic fire scenarios to test pathfinding and system fail-safes without physical hardware.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="card-md p-6">
           <SimulationControls
              simState={simState}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onManualOverride={handleManualOverride}
              onClearOverride={handleClearOverride}
              onClearAllOverrides={handleClearAllOverrides}
            />
        </div>
      </div>

    </div>
  );
}
