// ============================================================
// Dijkstra Pathfinding Engine
// Finds shortest safe evacuation path from any node to exits
// ============================================================

import type { BuildingGraph, EvacuationPath, HazardLevel } from './types';
import { EXIT_NODE_IDS } from './building-layout';

// ─── Min-Heap (Binary Heap) Priority Queue ──────────────────
class MinHeap<T> {
  private heap: { priority: number; value: T }[] = [];

  push(priority: number, value: T) {
    this.heap.push({ priority, value });
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): { priority: number; value: T } | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() { return this.heap.length; }

  private _bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].priority <= this.heap[i].priority) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private _sinkDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].priority < this.heap[smallest].priority) smallest = l;
      if (r < n && this.heap[r].priority < this.heap[smallest].priority) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// ─── Dijkstra Core ──────────────────────────────────────────
interface DijkstraResult {
  dist: Map<string, number>;
  prev: Map<string, string | null>;   // nodeId -> came-from nodeId
  prevEdge: Map<string, string | null>; // nodeId -> came-from edgeId
}

function dijkstra(graph: BuildingGraph, sourceId: string): DijkstraResult {
  const dist    = new Map<string, number>();
  const prev    = new Map<string, string | null>();
  const prevEdge= new Map<string, string | null>();
  const visited = new Set<string>();
  const pq      = new MinHeap<string>();

  for (const nodeId of graph.nodes.keys()) {
    dist.set(nodeId, Infinity);
    prev.set(nodeId, null);
    prevEdge.set(nodeId, null);
  }

  dist.set(sourceId, 0);
  pq.push(0, sourceId);

  while (pq.size > 0) {
    const { priority: cost, value: u } = pq.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);

    const edgeIds = graph.adjacency.get(u) ?? [];
    for (const edgeId of edgeIds) {
      const edge = graph.edges.get(edgeId)!;
      if (edge.isBlocked || edge.currentWeight === Infinity) continue;

      const v = edge.from === u ? edge.to : edge.from;
      const newDist = cost + edge.currentWeight;

      if (newDist < (dist.get(v) ?? Infinity)) {
        dist.set(v, newDist);
        prev.set(v, u);
        prevEdge.set(v, edgeId);
        pq.push(newDist, v);
      }
    }
  }

  return { dist, prev, prevEdge };
}

// ─── Reconstruct path from Dijkstra result ──────────────────
function reconstructPath(
  endId: string,
  prev: Map<string, string | null>,
  prevEdge: Map<string, string | null>,
  dist: Map<string, number>,
  graph: BuildingGraph,
): EvacuationPath | null {
  if ((dist.get(endId) ?? Infinity) === Infinity) return null;

  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  let cursor = endId;

  while (cursor !== null && cursor !== undefined) {
    nodeIds.unshift(cursor);
    const edge = prevEdge.get(cursor);
    if (edge) edgeIds.unshift(edge);
    cursor = prev.get(cursor)!;
  }

  // Determine worst hazard along path
  let worstHazard: HazardLevel = 'SAFE';
  const levels: HazardLevel[] = ['SAFE', 'CAUTION', 'WARNING', 'DANGER', 'BLOCKED'];
  for (const eid of edgeIds) {
    const edge = graph.edges.get(eid);
    if (!edge) continue;
    const idx = levels.indexOf(edge.hazardLevel);
    if (idx > levels.indexOf(worstHazard)) worstHazard = edge.hazardLevel;
  }

  return {
    nodeIds,
    edgeIds,
    totalCost: dist.get(endId) ?? Infinity,
    exitNodeId: endId,
    hazardLevel: worstHazard,
    computedAt: Date.now(),
  };
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Find the safest evacuation path from `sourceId` to any exit.
 * Returns the path with lowest total fused cost (safest route).
 */
export function findEvacuationPath(
  graph: BuildingGraph,
  sourceId: string,
  exitIds: string[] = EXIT_NODE_IDS,
): EvacuationPath | null {
  if (!graph.nodes.has(sourceId)) {
    console.error(`[Pathfinder] Unknown source node: ${sourceId}`);
    return null;
  }

  const start = performance.now();
  const { dist, prev, prevEdge } = dijkstra(graph, sourceId);

  // Pick the exit with lowest cost
  let bestPath: EvacuationPath | null = null;
  for (const exitId of exitIds) {
    const path = reconstructPath(exitId, prev, prevEdge, dist, graph);
    if (!path) continue;
    if (!bestPath || path.totalCost < bestPath.totalCost) {
      bestPath = path;
    }
  }

  const elapsed = performance.now() - start;
  if (elapsed > 300) {
    console.warn(`[Pathfinder] Computation took ${elapsed.toFixed(1)}ms (must be < 300ms)`);
  }

  return bestPath;
}

/**
 * Compute paths from every non-exit node to the safest exit.
 * Returns a map: sourceNodeId → EvacuationPath.
 */
export function computeAllPaths(
  graph: BuildingGraph,
  exitIds: string[] = EXIT_NODE_IDS,
): Map<string, EvacuationPath> {
  const result = new Map<string, EvacuationPath>();

  for (const [nodeId, node] of graph.nodes) {
    if (node.isExit) continue;
    const path = findEvacuationPath(graph, nodeId, exitIds);
    if (path) result.set(nodeId, path);
  }

  return result;
}

/**
 * Fallback: compute path purely on base weights (ignoring sensor data).
 * Used when communication is lost and we need a safe default.
 */
export function findFallbackPath(
  graph: BuildingGraph,
  sourceId: string,
  exitIds: string[] = EXIT_NODE_IDS,
): EvacuationPath | null {
  // Temporarily override weights with base weights
  const tempGraph: BuildingGraph = {
    nodes: graph.nodes,
    adjacency: graph.adjacency,
    edges: new Map(
      Array.from(graph.edges.entries()).map(([id, edge]) => [
        id,
        { ...edge, currentWeight: edge.baseWeight, isBlocked: false },
      ]),
    ),
  };
  return findEvacuationPath(tempGraph, sourceId, exitIds);
}
