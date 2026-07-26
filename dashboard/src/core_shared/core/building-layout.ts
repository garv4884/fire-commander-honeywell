// ============================================================
// 2-Story Commercial Building Layout Definition
// Nodes = rooms / hallways / exits / stairwells
// Edges = traversable corridor/door segments
// ============================================================

import type { Node, Edge, BuildingGraph } from './types';

// ─── SVG Canvas ───────────────────────────────────────────
// Floor 1: y = 80 – 380, Floor 2: y = 420 – 720
// Grid columns at x = 80, 200, 320, 440, 560
// ──────────────────────────────────────────────────────────

export const BUILDING_NODES: Node[] = [
  // ── FLOOR 1 ──────────────────────────────────────────────
  { id: 'F1_A1', label: 'Office A1',      floor: 1, x: 80,  y: 100, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_A2', label: 'Office A2',      floor: 1, x: 200, y: 100, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_A3', label: 'Office A3',      floor: 1, x: 320, y: 100, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_A4', label: 'Meeting Rm A4',  floor: 1, x: 440, y: 100, isExit: false, hazardLevel: 'SAFE' },

  { id: 'F1_H1', label: 'Hall 1W',        floor: 1, x: 80,  y: 220, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_H2', label: 'Hall 1C',        floor: 1, x: 220, y: 220, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_H3', label: 'Hall 1E',        floor: 1, x: 380, y: 220, isExit: false, hazardLevel: 'SAFE' },

  { id: 'F1_B1', label: 'Lobby B1',       floor: 1, x: 80,  y: 330, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_B2', label: 'Kitchen B2',     floor: 1, x: 200, y: 330, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_B3', label: 'Server Rm B3',   floor: 1, x: 320, y: 330, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_B4', label: 'Storage B4',     floor: 1, x: 440, y: 330, isExit: false, hazardLevel: 'SAFE' },

  { id: 'F1_STAIR_W', label: 'Stairwell W', floor: 1, x: 560, y: 220, isExit: false, isStairwell: true, hazardLevel: 'SAFE' },

  // Exits (Floor 1)
  { id: 'EXIT_NORTH', label: 'North Exit', floor: 1, x: 220, y: 30,  isExit: true, hazardLevel: 'SAFE' },
  { id: 'EXIT_SOUTH', label: 'South Exit', floor: 1, x: 320, y: 400, isExit: true, hazardLevel: 'SAFE' },
  { id: 'EXIT_WEST',  label: 'West Exit',  floor: 1, x: 10,  y: 220, isExit: true, hazardLevel: 'SAFE' },

  // ── FLOOR 2 ──────────────────────────────────────────────
  { id: 'F2_D1', label: 'Office D1',      floor: 2, x: 80,  y: 470, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_D2', label: 'Office D2',      floor: 2, x: 200, y: 470, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_D3', label: 'Office D3',      floor: 2, x: 320, y: 470, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_D4', label: 'Meeting Rm D4',  floor: 2, x: 440, y: 470, isExit: false, hazardLevel: 'SAFE' },

  { id: 'F2_H1', label: 'Hall 2W',        floor: 2, x: 80,  y: 570, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_H2', label: 'Hall 2C',        floor: 2, x: 220, y: 570, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_H3', label: 'Hall 2E',        floor: 2, x: 380, y: 570, isExit: false, hazardLevel: 'SAFE' },

  { id: 'F2_E1', label: 'Office E1',      floor: 2, x: 80,  y: 670, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_E2', label: 'Conf Rm E2',     floor: 2, x: 200, y: 670, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_E3', label: 'Office E3',      floor: 2, x: 320, y: 670, isExit: false, hazardLevel: 'SAFE' },

  { id: 'F2_STAIR_W', label: 'Stairwell W', floor: 2, x: 560, y: 570, isExit: false, isStairwell: true, hazardLevel: 'SAFE' },
];

export const BUILDING_EDGES: Edge[] = [
  // ── FLOOR 1: North corridor (offices to main hallway) ────
  { id: 'e1',  from: 'F1_A1', to: 'F1_H1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e2',  from: 'F1_A2', to: 'F1_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e3',  from: 'F1_A3', to: 'F1_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e4',  from: 'F1_A4', to: 'F1_H3', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 1: Exit connections from offices ───────────────
  { id: 'e5',  from: 'F1_A1', to: 'EXIT_NORTH', baseWeight: 15, currentWeight: 15, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e6',  from: 'F1_A2', to: 'EXIT_NORTH', baseWeight: 8,  currentWeight: 8,  isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 1: Main hallway horizontal ────────────────────
  { id: 'e7',  from: 'F1_H1', to: 'F1_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e8',  from: 'F1_H2', to: 'F1_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e9',  from: 'F1_H3', to: 'F1_STAIR_W', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 1: West Exit ───────────────────────────────────
  { id: 'e10', from: 'F1_H1', to: 'EXIT_WEST', baseWeight: 8, currentWeight: 8, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 1: South corridor (halls to south rooms) ───────
  { id: 'e11', from: 'F1_H1', to: 'F1_B1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e12', from: 'F1_H2', to: 'F1_B2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e13', from: 'F1_H3', to: 'F1_B3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e14', from: 'F1_H3', to: 'F1_B4', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 1: South rooms horizontal ─────────────────────
  { id: 'e15', from: 'F1_B1', to: 'F1_B2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e16', from: 'F1_B2', to: 'F1_B3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e17', from: 'F1_B3', to: 'EXIT_SOUTH', baseWeight: 8,  currentWeight: 8,  isBlocked: false, hazardLevel: 'SAFE' },

  // ── STAIRWELL: Floor 1 ↔ Floor 2 ────────────────────────
  { id: 'e18', from: 'F1_STAIR_W', to: 'F2_STAIR_W', baseWeight: 20, currentWeight: 20, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 2: North corridor ──────────────────────────────
  { id: 'e19', from: 'F2_D1', to: 'F2_H1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e20', from: 'F2_D2', to: 'F2_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e21', from: 'F2_D3', to: 'F2_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e22', from: 'F2_D4', to: 'F2_H3', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 2: Main hallway horizontal ────────────────────
  { id: 'e23', from: 'F2_H1', to: 'F2_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e24', from: 'F2_H2', to: 'F2_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e25', from: 'F2_H3', to: 'F2_STAIR_W', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 2: South corridor ──────────────────────────────
  { id: 'e26', from: 'F2_H1', to: 'F2_E1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e27', from: 'F2_H2', to: 'F2_E2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e28', from: 'F2_H3', to: 'F2_E3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 2: South rooms horizontal ─────────────────────
  { id: 'e29', from: 'F2_E1', to: 'F2_E2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e30', from: 'F2_E2', to: 'F2_E3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },

  // ── FLOOR 1 ↔ FLOOR 2 office connections (vertical) ─────
  { id: 'e31', from: 'F1_A1', to: 'F1_A2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e32', from: 'F1_A2', to: 'F1_A3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e33', from: 'F1_A3', to: 'F1_A4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e34', from: 'F2_D1', to: 'F2_D2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e35', from: 'F2_D2', to: 'F2_D3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e36', from: 'F2_D3', to: 'F2_D4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
];

// ─── Build the adjacency graph ──────────────────────────────
export function createBuildingGraph(): BuildingGraph {
  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge>();
  const adjacency = new Map<string, string[]>();

  for (const node of BUILDING_NODES) {
    nodes.set(node.id, { ...node });
    adjacency.set(node.id, []);
  }

  for (const edge of BUILDING_EDGES) {
    edges.set(edge.id, { ...edge });
    adjacency.get(edge.from)!.push(edge.id);
    adjacency.get(edge.to)!.push(edge.id);
  }

  return { nodes, edges, adjacency };
}

// Nodes that are exits (used by pathfinder as targets)
export const EXIT_NODE_IDS = ['EXIT_NORTH', 'EXIT_SOUTH', 'EXIT_WEST'];

// Default node to assign each ESP32 sensor node to a building zone
export const ESP32_ZONE_MAP: Record<string, string> = {
  'node_1': 'F1_B3',     // Server Room (high risk zone)
  'node_2': 'F1_H2',     // Central Hallway
  'node_3': 'F2_H2',     // Floor 2 Central
};
