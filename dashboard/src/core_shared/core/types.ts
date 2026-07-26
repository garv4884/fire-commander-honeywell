// ============================================================
// Dynamic Fire Evacuation Router — Shared Type Definitions
// ============================================================

export type HazardLevel = 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER' | 'BLOCKED';

export interface SensorReading {
  nodeId: string;
  timestamp: number;
  temperature: number;    // °C
  smokePpm: number;       // Parts per million
  flameDetected: boolean;
  occupancy: number;      // Number of occupants in zone
  isSimulated?: boolean;
}

export interface Node {
  id: string;
  label: string;
  floor: number;
  x: number;              // SVG coordinate x
  y: number;              // SVG coordinate y
  isExit: boolean;
  isStairwell?: boolean;
  hazardLevel: HazardLevel;
  sensors?: SensorReading;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  baseWeight: number;     // Base traversal cost (distance/time units)
  currentWeight: number;  // Live fused weight (Dijkstra uses this)
  isBlocked: boolean;
  hazardLevel: HazardLevel;
}

export interface BuildingGraph {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  adjacency: Map<string, string[]>; // nodeId -> list of edge IDs
}

export interface EvacuationPath {
  nodeIds: string[];       // Ordered list from source to exit
  edgeIds: string[];
  totalCost: number;
  exitNodeId: string;
  hazardLevel: HazardLevel;  // Worst hazard along the path
  computedAt: number;        // timestamp ms
}

export interface ZoneState {
  nodeId: string;
  sensors: SensorReading;
  hazardLevel: HazardLevel;
  fusedWeight: number;     // Computed edge multiplier for this zone
}

export interface SystemState {
  zones: Map<string, ZoneState>;
  paths: Map<string, EvacuationPath>; // sourceNodeId -> best path
  connectedNodes: Set<string>;         // ESP32 nodes online
  lastUpdate: number;
  alertCount: number;
  systemMode: 'NORMAL' | 'DEGRADED' | 'EMERGENCY' | 'ISOLATED';
}

export interface FireScenarioKeyframe {
  timeMs: number;
  nodeId: string;
  temperature: number;
  smokePpm: number;
  flameDetected: boolean;
  occupancy: number;
}

export interface FireScenario {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  keyframes: FireScenarioKeyframe[];
}

export interface SimulationState {
  isRunning: boolean;
  scenario: FireScenario | null;
  currentTimeMs: number;
  speedMultiplier: number;
  manualOverrides: Map<string, Partial<SensorReading>>;
}

export interface SensorFusionConfig {
  alpha: number;   // Temperature coefficient (default: 2.0)
  beta: number;    // Smoke coefficient (default: 3.0)
  gamma: number;   // Flame coefficient (default: 5.0)
  delta: number;   // Occupancy penalty (default: 0.1)
  tempAmbient: number;    // °C (default: 25)
  tempBlock: number;      // °C — edge becomes impassable (default: 150)
  smokeBlock: number;     // PPM — edge becomes impassable (default: 800)
}

export const DEFAULT_FUSION_CONFIG: SensorFusionConfig = {
  alpha: 2.0,
  beta: 3.0,
  gamma: 5.0,
  delta: 0.1,
  tempAmbient: 25,
  tempBlock: 150,
  smokeBlock: 800,
};

export interface MqttMessage {
  type: 'SENSOR' | 'PATH' | 'HEARTBEAT' | 'EMERGENCY';
  nodeId: string;
  sequence: number;
  payload: SensorReading | EvacuationPath | { alive: boolean } | { emergency: true };
  crc?: number;
}

export interface EventLogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  nodeId?: string;
  zoneLabel?: string;
}
