// ============================================================
// Sensor Fusion Engine
// W(edge) = base_weight × exp(α·T̃ + β·S̃ + γ·F) × (1 + δ·O)
// ============================================================

import type { SensorReading, Edge, HazardLevel, SensorFusionConfig } from './types';
import { DEFAULT_FUSION_CONFIG } from './types';

// ─── Hazard Classification ──────────────────────────────────
export function classifyHazard(reading: SensorReading): HazardLevel {
  const { temperature, smokePpm, flameDetected } = reading;

  if (temperature > 150 || smokePpm > 800) return 'BLOCKED';
  if (temperature > 80  || smokePpm > 500 || flameDetected) return 'DANGER';
  if (temperature > 60  || smokePpm > 300) return 'WARNING';
  if (temperature > 40  || smokePpm > 100) return 'CAUTION';
  return 'SAFE';
}

// ─── Normalised temperature [0, 1] ──────────────────────────
function normaliseTemp(temp: number, config: SensorFusionConfig): number {
  // Normalise between ambient and flashover (600°C)
  const range = 600 - config.tempAmbient;
  return Math.max(0, Math.min(1, (temp - config.tempAmbient) / range));
}

// ─── Normalised smoke [0, 1] ────────────────────────────────
function normaliseSmoke(ppm: number): number {
  return Math.max(0, Math.min(1, ppm / 1000));
}

// ─── Compute fused edge weight ───────────────────────────────
// Given sensor readings for the two nodes this edge connects,
// return the dynamically fused traversal weight.
export function computeEdgeWeight(
  edge: Edge,
  fromReading: SensorReading | null,
  toReading: SensorReading | null,
  config: SensorFusionConfig = DEFAULT_FUSION_CONFIG,
): { weight: number; blocked: boolean; hazardLevel: HazardLevel } {

  // Use the worst of the two zone readings (conservative)
  const temp  = Math.max(fromReading?.temperature ?? 25, toReading?.temperature ?? 25);
  const smoke = Math.max(fromReading?.smokePpm    ?? 0,  toReading?.smokePpm    ?? 0);
  const flame = (fromReading?.flameDetected ?? false) || (toReading?.flameDetected ?? false);
  const occ   = (toReading?.occupancy ?? 0); // penalise crowded destination

  // Hard block thresholds — per PS: flame = immediately reroute
  if (temp > config.tempBlock || smoke > config.smokeBlock || flame) {
    return { weight: Infinity, blocked: true, hazardLevel: 'BLOCKED' };
  }

  // Exponential fusion formula
  const tNorm = normaliseTemp(temp, config);
  const sNorm = normaliseSmoke(smoke);
  const fVal  = flame ? 1.0 : 0.0;

  const exponent = config.alpha * tNorm + config.beta * sNorm + config.gamma * fVal;
  const multiplier = Math.exp(exponent);
  const occupancyPenalty = 1 + config.delta * occ;
  const weight = edge.baseWeight * multiplier * occupancyPenalty;

  // Determine hazard level
  const mockReading: SensorReading = {
    nodeId: edge.id,
    timestamp: Date.now(),
    temperature: temp,
    smokePpm: smoke,
    flameDetected: flame,
    occupancy: occ,
  };
  const hazardLevel = classifyHazard(mockReading);

  return { weight, blocked: false, hazardLevel };
}

// ─── Batch update all edges in the graph ────────────────────
import type { BuildingGraph } from './types';

export function updateAllEdgeWeights(
  graph: BuildingGraph,
  sensorData: Map<string, SensorReading>,
  config: SensorFusionConfig = DEFAULT_FUSION_CONFIG,
): void {
  const start = performance.now();

  for (const [edgeId, edge] of graph.edges) {
    const fromReading = sensorData.get(edge.from) ?? null;
    const toReading   = sensorData.get(edge.to)   ?? null;

    const { weight, blocked, hazardLevel } = computeEdgeWeight(
      edge, fromReading, toReading, config,
    );

    graph.edges.set(edgeId, {
      ...edge,
      currentWeight: weight,
      isBlocked: blocked,
      hazardLevel,
    });
  }

  const elapsed = performance.now() - start;
  if (elapsed > 50) {
    console.warn(`[SensorFusion] Weight update took ${elapsed.toFixed(1)}ms (target < 50ms)`);
  }
}

// ─── Compute a single zone's fused risk score [0, 100] ──────
export function computeZoneRiskScore(reading: SensorReading, config: SensorFusionConfig = DEFAULT_FUSION_CONFIG): number {
  const tNorm = normaliseTemp(reading.temperature, config);
  const sNorm = normaliseSmoke(reading.smokePpm);
  const fVal  = reading.flameDetected ? 1.0 : 0.0;

  // Weighted sum (not exponential — for display purposes)
  const score = (
    (tNorm * config.alpha) +
    (sNorm * config.beta) +
    (fVal  * config.gamma)
  ) / (config.alpha + config.beta + config.gamma);

  return Math.min(100, score * 100);
}
