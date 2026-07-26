// ============================================================
// Browser-side Sensor Fusion (mirrors firmware/sensor_fusion.py)
// ============================================================

import type { SensorReading, Edge, HazardLevel, SensorFusionConfig } from '../core/types';
import { DEFAULT_FUSION_CONFIG } from '../core/types';
import type { BuildingGraph } from '../core/types';

export function classifyHazard(r: SensorReading): HazardLevel {
  if (r.temperature > 150 || r.smokePpm > 800) return 'BLOCKED';
  if (r.temperature > 80  || r.smokePpm > 500 || r.flameDetected) return 'DANGER';
  if (r.temperature > 60  || r.smokePpm > 300) return 'WARNING';
  if (r.temperature > 40  || r.smokePpm > 100) return 'CAUTION';
  return 'SAFE';
}

function normTemp(t: number, cfg: SensorFusionConfig) {
  return Math.max(0, Math.min(1, (t - cfg.tempAmbient) / (600 - cfg.tempAmbient)));
}
function normSmoke(ppm: number) { return Math.max(0, Math.min(1, ppm / 1000)); }

export function computeEdgeWeight(
  edge: Edge,
  fromR: SensorReading | null,
  toR: SensorReading | null,
  cfg = DEFAULT_FUSION_CONFIG,
): { weight: number; blocked: boolean; hazardLevel: HazardLevel } {
  const temp  = Math.max(fromR?.temperature ?? 25, toR?.temperature ?? 25);
  const smoke = Math.max(fromR?.smokePpm ?? 0,    toR?.smokePpm ?? 0);
  const flame = (fromR?.flameDetected ?? false) || (toR?.flameDetected ?? false);
  const occ   = toR?.occupancy ?? 0;

  if (temp > cfg.tempBlock || smoke > cfg.smokeBlock) {
    return { weight: Infinity, blocked: true, hazardLevel: 'BLOCKED' };
  }

  const exponent = cfg.alpha * normTemp(temp, cfg) + cfg.beta * normSmoke(smoke) + cfg.gamma * (flame ? 1 : 0);
  const weight = edge.baseWeight * Math.exp(exponent) * (1 + cfg.delta * occ);

  const mockR: SensorReading = {
    nodeId: '', timestamp: 0, temperature: temp, smokePpm: smoke, flameDetected: flame, occupancy: occ,
  };
  return { weight, blocked: false, hazardLevel: classifyHazard(mockR) };
}

export function updateAllEdgeWeights(
  graph: BuildingGraph,
  sensorData: Map<string, SensorReading>,
  cfg = DEFAULT_FUSION_CONFIG,
): void {
  for (const [edgeId, edge] of graph.edges) {
    const fromR = sensorData.get(edge.from) ?? null;
    const toR   = sensorData.get(edge.to)   ?? null;
    const { weight, blocked, hazardLevel } = computeEdgeWeight(edge, fromR, toR, cfg);
    graph.edges.set(edgeId, { ...edge, currentWeight: weight, isBlocked: blocked, hazardLevel });
  }
}

export function computeZoneRiskScore(r: SensorReading, cfg = DEFAULT_FUSION_CONFIG): number {
  const t = normTemp(r.temperature, cfg);
  const s = normSmoke(r.smokePpm);
  const f = r.flameDetected ? 1 : 0;
  const total = cfg.alpha + cfg.beta + cfg.gamma;
  return Math.min(100, ((cfg.alpha * t + cfg.beta * s + cfg.gamma * f) / total) * 100);
}

export function defaultReading(nodeId: string): SensorReading {
  return {
    nodeId,
    timestamp: Date.now(),
    temperature: 24 + Math.random() * 2,
    smokePpm: Math.random() * 10,
    flameDetected: false,
    occupancy: 0,
    isSimulated: false,
  };
}
