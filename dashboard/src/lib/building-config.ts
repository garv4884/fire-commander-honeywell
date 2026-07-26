// ============================================================
// Building configuration for dashboard rendering
// Mirrors src/core/building-layout.ts with SVG coordinates
// ============================================================

import type { Node, Edge } from '../core/types';

export const SVG_WIDTH  = 680;
export const SVG_HEIGHT = 760;

// Floor separator line
export const FLOOR_SEPARATOR_Y = 420;

export const BUILDING_NODES: Node[] = [
  // ── FLOOR 0 (Ground) ──────────────────────────────────────────────
  { id: 'F1_A1', label: 'Office A1',      floor: 0, x: 80,  y: 100, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_A2', label: 'Office A2',      floor: 0, x: 200, y: 100, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_A3', label: 'Office A3',      floor: 0, x: 320, y: 100, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_A4', label: 'Meeting A4',     floor: 0, x: 440, y: 100, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_A5', label: 'Storage A5',     floor: 0, x: 560, y: 100, isExit: false, hazardLevel: 'SAFE' }, // NEW

  { id: 'F1_H1', label: 'Hall 1W',        floor: 0, x: 80,  y: 210, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_H2', label: 'Hall 1C',        floor: 0, x: 220, y: 210, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_H3', label: 'Hall 1E',        floor: 0, x: 380, y: 210, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_H4', label: 'Hall 1EE',       floor: 0, x: 480, y: 210, isExit: false, hazardLevel: 'SAFE' }, // NEW

  { id: 'F1_B1', label: 'Lobby B1',       floor: 0, x: 80,  y: 320, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_B2', label: 'Kitchen B2',     floor: 0, x: 200, y: 320, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_B3', label: 'Server Rm B3',   floor: 0, x: 320, y: 320, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_B4', label: 'Storage B4',     floor: 0, x: 440, y: 320, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F1_B5', label: 'Maint. B5',      floor: 0, x: 560, y: 320, isExit: false, hazardLevel: 'SAFE' }, // NEW

  { id: 'F1_STAIR_W', label: 'Stairs',    floor: 0, x: 620, y: 210, isExit: false, isStairwell: true, hazardLevel: 'SAFE' }, // MOVED
  { id: 'F1_STAIR_E', label: 'Stairs E',  floor: 0, x: 80,  y: 35,  isExit: false, isStairwell: true, hazardLevel: 'SAFE' }, // NEW

  { id: 'EXIT_NORTH', label: '🚪 North Exit', floor: 0, x: 220, y: 35,  isExit: true, hazardLevel: 'SAFE' },
  { id: 'EXIT_SOUTH', label: '🚪 South Exit', floor: 0, x: 320, y: 390, isExit: true, hazardLevel: 'SAFE' },
  { id: 'EXIT_WEST',  label: '🚪 West Exit',  floor: 0, x: 15,  y: 210, isExit: true, hazardLevel: 'SAFE' },
  { id: 'EXIT_EAST',  label: '🚪 East Exit',  floor: 0, x: 620, y: 100, isExit: true, hazardLevel: 'SAFE' }, // NEW

  // ── FLOOR 1 ──────────────────────────────────────────────
  { id: 'F2_D1', label: 'Office D1',      floor: 1, x: 80,  y: 480, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_D2', label: 'Office D2',      floor: 1, x: 200, y: 480, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_D3', label: 'Office D3',      floor: 1, x: 320, y: 480, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_D4', label: 'Meeting D4',     floor: 1, x: 440, y: 480, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_D5', label: 'Storage D5',     floor: 1, x: 560, y: 480, isExit: false, hazardLevel: 'SAFE' }, // NEW

  { id: 'F2_H1', label: 'Hall 2W',        floor: 1, x: 80,  y: 580, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_H2', label: 'Hall 2C',        floor: 1, x: 220, y: 580, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_H3', label: 'Hall 2E',        floor: 1, x: 380, y: 580, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_H4', label: 'Hall 2EE',       floor: 1, x: 480, y: 580, isExit: false, hazardLevel: 'SAFE' }, // NEW

  { id: 'F2_E1', label: 'Office E1',      floor: 1, x: 80,  y: 680, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_E2', label: 'Conf Rm E2',     floor: 1, x: 200, y: 680, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_E3', label: 'Office E3',      floor: 1, x: 320, y: 680, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F2_E4', label: 'Maint. E4',      floor: 1, x: 440, y: 680, isExit: false, hazardLevel: 'SAFE' }, // NEW

  { id: 'F2_STAIR_W', label: 'Stairs',    floor: 1, x: 620, y: 580, isExit: false, isStairwell: true, hazardLevel: 'SAFE' },
  { id: 'F2_STAIR_E', label: 'Stairs E',  floor: 1, x: 80,  y: 410, isExit: false, isStairwell: true, hazardLevel: 'SAFE' }, // NEW
  
  // ── FLOOR 2 ──────────────────────────────────────────────
  { id: 'F3_G1', label: 'Exec Suite G1',  floor: 2, x: 200, y: 860, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F3_G2', label: 'Exec Suite G2',  floor: 2, x: 320, y: 860, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F3_G3', label: 'Lounge G3',      floor: 2, x: 440, y: 860, isExit: false, hazardLevel: 'SAFE' }, // NEW
  
  { id: 'F3_H1', label: 'Hall 3W',        floor: 2, x: 200, y: 960, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F3_H2', label: 'Hall 3E',        floor: 2, x: 320, y: 960, isExit: false, hazardLevel: 'SAFE' },
  { id: 'F3_H3', label: 'Hall 3EE',       floor: 2, x: 440, y: 960, isExit: false, hazardLevel: 'SAFE' }, // NEW
  
  { id: 'F3_STAIR_W', label: 'Stairs',    floor: 2, x: 620, y: 960, isExit: false, isStairwell: true, hazardLevel: 'SAFE' },
  { id: 'F3_STAIR_E', label: 'Stairs E',  floor: 2, x: 80,  y: 860, isExit: false, isStairwell: true, hazardLevel: 'SAFE' }, // NEW
];

export const BUILDING_EDGES: Edge[] = [
  { id: 'e1',  from: 'F1_A1', to: 'F1_H1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e2',  from: 'F1_A2', to: 'F1_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e3',  from: 'F1_A3', to: 'F1_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e4',  from: 'F1_A4', to: 'F1_H4', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e4_new', from: 'F1_A5', to: 'F1_H4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e5',  from: 'F1_A1', to: 'EXIT_NORTH', baseWeight: 15, currentWeight: 15, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e6',  from: 'F1_A2', to: 'EXIT_NORTH', baseWeight: 8,  currentWeight: 8,  isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e7',  from: 'F1_H1', to: 'F1_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e8',  from: 'F1_H2', to: 'F1_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e8_new', from: 'F1_H3', to: 'F1_H4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e9',  from: 'F1_H4', to: 'F1_STAIR_W', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e10', from: 'F1_H1', to: 'EXIT_WEST', baseWeight: 8, currentWeight: 8, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e10_new', from: 'F1_A1', to: 'F1_STAIR_E', baseWeight: 8, currentWeight: 8, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e11', from: 'F1_H1', to: 'F1_B1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e12', from: 'F1_H2', to: 'F1_B2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e13', from: 'F1_H3', to: 'F1_B3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e14', from: 'F1_H4', to: 'F1_B4', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e14_new', from: 'F1_H4', to: 'F1_B5', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e15', from: 'F1_B1', to: 'F1_B2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e16', from: 'F1_B2', to: 'F1_B3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e16_new', from: 'F1_B3', to: 'F1_B4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e16_new2', from: 'F1_B4', to: 'F1_B5', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e17', from: 'F1_B3', to: 'EXIT_SOUTH', baseWeight: 8, currentWeight: 8, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e17_new', from: 'F1_A5', to: 'EXIT_EAST', baseWeight: 8, currentWeight: 8, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e18', from: 'F1_STAIR_W', to: 'F2_STAIR_W', baseWeight: 20, currentWeight: 20, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e18_new', from: 'F1_STAIR_E', to: 'F2_STAIR_E', baseWeight: 20, currentWeight: 20, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e19', from: 'F2_D1', to: 'F2_H1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e20', from: 'F2_D2', to: 'F2_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e21', from: 'F2_D3', to: 'F2_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e22', from: 'F2_D4', to: 'F2_H4', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e22_new', from: 'F2_D5', to: 'F2_H4', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e23', from: 'F2_H1', to: 'F2_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e24', from: 'F2_H2', to: 'F2_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e24_new', from: 'F2_H3', to: 'F2_H4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e25', from: 'F2_H4', to: 'F2_STAIR_W', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e25_new', from: 'F2_D1', to: 'F2_STAIR_E', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e26', from: 'F2_H1', to: 'F2_E1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e27', from: 'F2_H2', to: 'F2_E2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e28', from: 'F2_H3', to: 'F2_E3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e28_new', from: 'F2_H4', to: 'F2_E4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e29', from: 'F2_E1', to: 'F2_E2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e30', from: 'F2_E2', to: 'F2_E3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e30_new', from: 'F2_E3', to: 'F2_E4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e31', from: 'F1_A1', to: 'F1_A2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e32', from: 'F1_A2', to: 'F1_A3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e33', from: 'F1_A3', to: 'F1_A4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e33_new', from: 'F1_A4', to: 'F1_A5', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e34', from: 'F2_D1', to: 'F2_D2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e35', from: 'F2_D2', to: 'F2_D3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e36', from: 'F2_D3', to: 'F2_D4', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e36_new', from: 'F2_D4', to: 'F2_D5', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e37', from: 'F2_STAIR_W', to: 'F3_STAIR_W', baseWeight: 20, currentWeight: 20, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e37_new', from: 'F2_STAIR_E', to: 'F3_STAIR_E', baseWeight: 20, currentWeight: 20, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e38', from: 'F3_G1', to: 'F3_H1', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e39', from: 'F3_G2', to: 'F3_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e39_new', from: 'F3_G3', to: 'F3_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e40', from: 'F3_H1', to: 'F3_H2', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e40_new', from: 'F3_H2', to: 'F3_H3', baseWeight: 10, currentWeight: 10, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e41', from: 'F3_H3', to: 'F3_STAIR_W', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
  { id: 'e41_new', from: 'F3_G1', to: 'F3_STAIR_E', baseWeight: 12, currentWeight: 12, isBlocked: false, hazardLevel: 'SAFE' },
];

export const EXIT_NODE_IDS = ['EXIT_NORTH', 'EXIT_SOUTH', 'EXIT_WEST', 'EXIT_EAST'];

export const HAZARD_COLORS: Record<string, string> = {
  SAFE:    '#16a34a',
  CAUTION: '#ca8a04',
  WARNING: '#ea580c',
  DANGER:  '#dc2626',
  BLOCKED: '#450a0a',
};

export const HAZARD_FILL: Record<string, string> = {
  SAFE:    'rgba(22,163,74,0.18)',
  CAUTION: 'rgba(202,138,4,0.22)',
  WARNING: 'rgba(234,88,12,0.28)',
  DANGER:  'rgba(220,38,38,0.35)',
  BLOCKED: 'rgba(69,10,10,0.6)',
};
