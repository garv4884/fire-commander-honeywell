// ============================================================
// Fire Simulation Engine
// Simulates fire spread physics + injects sensor readings
// ============================================================

import type {
  SensorReading,
  FireScenario,
  FireScenarioKeyframe,
  SimulationState,
  Node
} from '../core/types';
import { BUILDING_NODES } from './building-config';

// ─── Preset Scenarios ───────────────────────────────────────

export const PRESET_SCENARIOS: FireScenario[] = [
  {
    id: 'slow_smolder',
    name: '🔥 Slow Smolder',
    description: 'Gradual fire in Server Room B3. Smoke rises first, then temperature. Realistic slow ignition.',
    durationMs: 60_000,
    keyframes: [
      { timeMs: 0,      nodeId: 'F1_B3', temperature: 25,  smokePpm: 0,   flameDetected: false, occupancy: 2 },
      { timeMs: 10_000, nodeId: 'F1_B3', temperature: 30,  smokePpm: 80,  flameDetected: false, occupancy: 2 },
      { timeMs: 20_000, nodeId: 'F1_B3', temperature: 45,  smokePpm: 200, flameDetected: false, occupancy: 1 },
      { timeMs: 30_000, nodeId: 'F1_B3', temperature: 70,  smokePpm: 400, flameDetected: true,  occupancy: 0 },
      { timeMs: 45_000, nodeId: 'F1_B3', temperature: 110, smokePpm: 650, flameDetected: true,  occupancy: 0 },
      { timeMs: 60_000, nodeId: 'F1_B3', temperature: 160, smokePpm: 900, flameDetected: true,  occupancy: 0 },

      // Smoke spreads to adjacent hallway H3 at 25s
      { timeMs: 25_000, nodeId: 'F1_H3', temperature: 27, smokePpm: 120, flameDetected: false, occupancy: 0 },
      { timeMs: 40_000, nodeId: 'F1_H3', temperature: 35, smokePpm: 280, flameDetected: false, occupancy: 0 },
      { timeMs: 55_000, nodeId: 'F1_H3', temperature: 50, smokePpm: 450, flameDetected: false, occupancy: 0 },
    ],
  },
  {
    id: 'fast_flashover',
    name: '💥 Fast Flashover',
    description: 'Rapid flashover in Kitchen B2. Temperature spikes to 300°C in 5 seconds. All sensors max.',
    durationMs: 20_000,
    keyframes: [
      { timeMs: 0,      nodeId: 'F1_B2', temperature: 25,  smokePpm: 0,   flameDetected: false, occupancy: 3 },
      { timeMs: 2_000,  nodeId: 'F1_B2', temperature: 80,  smokePpm: 300, flameDetected: true,  occupancy: 2 },
      { timeMs: 5_000,  nodeId: 'F1_B2', temperature: 300, smokePpm: 850, flameDetected: true,  occupancy: 0 },
      { timeMs: 8_000,  nodeId: 'F1_B2', temperature: 500, smokePpm: 999, flameDetected: true,  occupancy: 0 },

      // Spread to B1 and B3
      { timeMs: 5_000,  nodeId: 'F1_B1', temperature: 60,  smokePpm: 200, flameDetected: false, occupancy: 1 },
      { timeMs: 10_000, nodeId: 'F1_B1', temperature: 120, smokePpm: 600, flameDetected: true,  occupancy: 0 },
      { timeMs: 5_000,  nodeId: 'F1_B3', temperature: 55,  smokePpm: 180, flameDetected: false, occupancy: 2 },
      { timeMs: 10_000, nodeId: 'F1_B3', temperature: 100, smokePpm: 500, flameDetected: true,  occupancy: 0 },

      // Hallway smoke
      { timeMs: 8_000,  nodeId: 'F1_H2', temperature: 40,  smokePpm: 350, flameDetected: false, occupancy: 5 },
      { timeMs: 15_000, nodeId: 'F1_H2', temperature: 75,  smokePpm: 600, flameDetected: false, occupancy: 0 },
    ],
  },
  {
    id: 'smoke_spread',
    name: '🌫️ Smoke Spread',
    description: 'HVAC-driven smoke propagation across floor 1. No flame, high smoke density.',
    durationMs: 45_000,
    keyframes: [
      { timeMs: 0,      nodeId: 'F1_A3', temperature: 30,  smokePpm: 150, flameDetected: false, occupancy: 4 },
      { timeMs: 10_000, nodeId: 'F1_A3', temperature: 35,  smokePpm: 550, flameDetected: false, occupancy: 4 },
      { timeMs: 15_000, nodeId: 'F1_A2', temperature: 28,  smokePpm: 120, flameDetected: false, occupancy: 3 },
      { timeMs: 20_000, nodeId: 'F1_A2', temperature: 30,  smokePpm: 480, flameDetected: false, occupancy: 2 },
      { timeMs: 20_000, nodeId: 'F1_H2', temperature: 27,  smokePpm: 100, flameDetected: false, occupancy: 6 },
      { timeMs: 30_000, nodeId: 'F1_H2', temperature: 30,  smokePpm: 550, flameDetected: false, occupancy: 3 },
      { timeMs: 30_000, nodeId: 'F1_H1', temperature: 28,  smokePpm: 90,  flameDetected: false, occupancy: 2 },
      { timeMs: 40_000, nodeId: 'F1_H1', temperature: 30,  smokePpm: 520, flameDetected: false, occupancy: 0 },
      { timeMs: 25_000, nodeId: 'F1_B2', temperature: 28,  smokePpm: 80,  flameDetected: false, occupancy: 2 },
      { timeMs: 40_000, nodeId: 'F1_B2', temperature: 32,  smokePpm: 420, flameDetected: false, occupancy: 0 },
    ],
  },
  {
    id: 'multi_floor',
    name: '🏢 Multi-Floor Fire',
    description: 'Fire starts on Floor 2 office D3 and spreads via stairwell to Floor 1.',
    durationMs: 50_000,
    keyframes: [
      { timeMs: 0,      nodeId: 'F2_D3', temperature: 25,  smokePpm: 0,   flameDetected: false, occupancy: 2 },
      { timeMs: 8_000,  nodeId: 'F2_D3', temperature: 70,  smokePpm: 300, flameDetected: true,  occupancy: 1 },
      { timeMs: 15_000, nodeId: 'F2_D3', temperature: 130, smokePpm: 700, flameDetected: true,  occupancy: 0 },
      { timeMs: 10_000, nodeId: 'F2_H3', temperature: 35,  smokePpm: 150, flameDetected: false, occupancy: 3 },
      { timeMs: 20_000, nodeId: 'F2_H3', temperature: 60,  smokePpm: 400, flameDetected: false, occupancy: 0 },
      { timeMs: 15_000, nodeId: 'F2_STAIR_W', temperature: 40, smokePpm: 200, flameDetected: false, occupancy: 2 },
      { timeMs: 25_000, nodeId: 'F2_STAIR_W', temperature: 80, smokePpm: 500, flameDetected: true,  occupancy: 0 },
      // Spreads down stairwell to Floor 1
      { timeMs: 30_000, nodeId: 'F1_STAIR_W', temperature: 55, smokePpm: 300, flameDetected: false, occupancy: 1 },
      { timeMs: 40_000, nodeId: 'F1_STAIR_W', temperature: 90, smokePpm: 600, flameDetected: true,  occupancy: 0 },
      // North offices affected by smoke
      { timeMs: 35_000, nodeId: 'F2_D4', temperature: 40,  smokePpm: 180, flameDetected: false, occupancy: 4 },
      { timeMs: 45_000, nodeId: 'F2_D4', temperature: 70,  smokePpm: 400, flameDetected: false, occupancy: 0 },
    ],
  },
];

// ─── Simulation Engine ──────────────────────────────────────

type SensorCallback = (readings: Map<string, SensorReading>) => void;

export class FireSimulator {
  private state: SimulationState = {
    isRunning: false,
    scenario: null,
    currentTimeMs: 0,
    speedMultiplier: 1,
    manualOverrides: new Map(),
  };

  private baseReadings: Map<string, SensorReading> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private callbacks: SensorCallback[] = [];
  private tickMs = 100; // 10 Hz simulation tick
  private currentNodes: Node[] = BUILDING_NODES;

  constructor() {
    this._initBaseReadings();
  }

  loadGraph(nodes: Node[]) {
    this.currentNodes = nodes;
    this.stop();
  }

  private _initBaseReadings() {
    this.baseReadings.clear();
    for (const node of this.currentNodes) {
      this.baseReadings.set(node.id, {
        nodeId: node.id,
        timestamp: Date.now(),
        temperature: 24 + Math.random() * 2,  // 24-26°C ambient
        smokePpm: Math.random() * 10,           // 0-10 PPM baseline
        flameDetected: false,
        occupancy: Math.floor(Math.random() * 3),
        isSimulated: true,
      });
    }
  }

  onSensorUpdate(cb: SensorCallback) {
    this.callbacks.push(cb);
  }

  getState(): SimulationState {
    return { ...this.state };
  }

  getCurrentReadings(): Map<string, SensorReading> {
    const readings = new Map(this.baseReadings);

    // Apply manual overrides
    for (const [nodeId, override] of this.state.manualOverrides) {
      const existing = readings.get(nodeId) ?? this._defaultReading(nodeId);
      readings.set(nodeId, { ...existing, ...override, timestamp: Date.now() });
    }

    return readings;
  }

  private _defaultReading(nodeId: string): SensorReading {
    return { nodeId, timestamp: Date.now(), temperature: 25, smokePpm: 0, flameDetected: false, occupancy: 0, isSimulated: true };
  }

  loadScenario(scenario: FireScenario) {
    this.stop();
    this.state = { ...this.state, scenario, currentTimeMs: 0, isRunning: false };
    this._initBaseReadings();
  }

  play(speedMultiplier = 1) {
    if (this.state.isRunning) return;
    this.state = { ...this.state, isRunning: true, speedMultiplier };

    this.timer = setInterval(() => {
      this._tick();
    }, this.tickMs);
  }

  pause() {
    if (this.timer) clearInterval(this.timer);
    this.state = { ...this.state, isRunning: false };
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.state = { ...this.state, isRunning: false, currentTimeMs: 0 };
    this._initBaseReadings();
    this._emit();
  }

  setManualOverride(nodeId: string, values: Partial<SensorReading>) {
    this.state.manualOverrides.set(nodeId, values);
    this._emit();
  }

  clearManualOverride(nodeId: string) {
    this.state.manualOverrides.delete(nodeId);
    this._emit();
  }

  clearAllManualOverrides() {
    this.state.manualOverrides.clear();
    this._emit();
  }

  private _tick() {
    const advance = this.tickMs * this.state.speedMultiplier;
    const newTime = this.state.currentTimeMs + advance;

    if (this.state.scenario && newTime >= this.state.scenario.durationMs) {
      this.pause();
      return;
    }

    this.state = { ...this.state, currentTimeMs: newTime };
    this._applyKeyframes(newTime);
    this._emit();
  }

  private _applyKeyframes(currentMs: number) {
    if (!this.state.scenario) return;

    // Group keyframes by nodeId
    const byNode = new Map<string, FireScenarioKeyframe[]>();
    for (const kf of this.state.scenario.keyframes) {
      if (!byNode.has(kf.nodeId)) byNode.set(kf.nodeId, []);
      byNode.get(kf.nodeId)!.push(kf);
    }

    for (const [nodeId, keyframes] of byNode) {
      const sorted = keyframes.filter(k => k.timeMs <= currentMs).sort((a, b) => b.timeMs - a.timeMs);
      if (sorted.length === 0) continue;

      const prev = sorted[0];
      const next = keyframes.filter(k => k.timeMs > currentMs).sort((a, b) => a.timeMs - b.timeMs)[0];

      let reading: SensorReading;
      if (next) {
        // Lerp between prev and next keyframes
        const t = (currentMs - prev.timeMs) / (next.timeMs - prev.timeMs);
        reading = {
          nodeId,
          timestamp: Date.now(),
          temperature:   lerp(prev.temperature, next.temperature, t),
          smokePpm:      lerp(prev.smokePpm,    next.smokePpm,    t),
          flameDetected: t > 0.5 ? next.flameDetected : prev.flameDetected,
          occupancy:     Math.round(lerp(prev.occupancy, next.occupancy, t)),
          isSimulated:   true,
        };
      } else {
        reading = { ...prev, nodeId, timestamp: Date.now(), isSimulated: true };
      }

      this.baseReadings.set(nodeId, reading);
    }
  }

  private _emit() {
    const readings = this.getCurrentReadings();
    for (const cb of this.callbacks) cb(readings);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// Singleton instance
export const fireSimulator = new FireSimulator();
