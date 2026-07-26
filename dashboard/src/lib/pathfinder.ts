// ============================================================
// Browser-side Pathfinder (mirrors firmware/pathfinder.py)
// Runs Dijkstra entirely in the browser — no server needed
// ============================================================

import type { BuildingGraph, EvacuationPath, HazardLevel } from '../core/types';
import type { Node, Edge } from '../core/types';

// ─── Build graph ─────────────────────────────────────────────
export function buildGraph(nodesList: Node[], edgesList: Edge[]): BuildingGraph {
  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodesList) {
    nodes.set(node.id, { ...node });
    adjacency.set(node.id, []);
  }
  for (const edge of edgesList) {
    edges.set(edge.id, { ...edge });
    adjacency.get(edge.from)!.push(edge.id);
    adjacency.get(edge.to)!.push(edge.id);
  }
  return { nodes, edges, adjacency };
}

// ─── Min-Heap ────────────────────────────────────────────────
class MinHeap {
  private heap: [number, string][] = [];
  push(p: number, v: string) {
    this.heap.push([p, v]);
    let i = this.heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent][0] <= this.heap[i][0]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }
  pop(): [number, string] | undefined {
    if (!this.heap.length) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length) {
      this.heap[0] = last;
      let i = 0;
      while (true) {
        let sm = i, l = 2*i+1, r = 2*i+2;
        if (l < this.heap.length && this.heap[l][0] < this.heap[sm][0]) sm = l;
        if (r < this.heap.length && this.heap[r][0] < this.heap[sm][0]) sm = r;
        if (sm === i) break;
        [this.heap[sm], this.heap[i]] = [this.heap[i], this.heap[sm]];
        i = sm;
      }
    }
    return top;
  }
  get size() { return this.heap.length; }
}

// ─── Dijkstra ────────────────────────────────────────────────
function dijkstra(graph: BuildingGraph, src: string) {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const prevEdge = new Map<string, string | null>();
  const visited = new Set<string>();
  const pq = new MinHeap();

  for (const id of graph.nodes.keys()) {
    dist.set(id, Infinity);
    prev.set(id, null);
    prevEdge.set(id, null);
  }
  dist.set(src, 0);
  pq.push(0, src);

  while (pq.size > 0) {
    const [cost, u] = pq.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);
    for (const eid of (graph.adjacency.get(u) ?? [])) {
      const edge = graph.edges.get(eid)!;
      let w = edge.currentWeight;
      if (edge.isBlocked || w === Infinity) {
        if (u === src) w = 10000; // Allow escaping origin node
        else continue;
      }
      const v = edge.from === u ? edge.to : edge.from;
      const nd = cost + w;
      if (nd < (dist.get(v) ?? Infinity)) {
        dist.set(v, nd);
        prev.set(v, u);
        prevEdge.set(v, eid);
        pq.push(nd, v);
      }
    }
  }
  return { dist, prev, prevEdge };
}

// ─── Reconstruct ─────────────────────────────────────────────
function reconstruct(
  endId: string,
  prev: Map<string, string | null>,
  prevEdge: Map<string, string | null>,
  dist: Map<string, number>,
  graph: BuildingGraph,
): EvacuationPath | null {
  if ((dist.get(endId) ?? Infinity) === Infinity) return null;
  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  let cursor: string | null = endId;
  while (cursor) {
    nodeIds.unshift(cursor);
    const eid = prevEdge.get(cursor);
    if (eid) edgeIds.unshift(eid);
    cursor = prev.get(cursor) ?? null;
  }

  const levels: HazardLevel[] = ['SAFE','CAUTION','WARNING','DANGER','BLOCKED'];
  let worstHazard: HazardLevel = 'SAFE';
  for (const eid of edgeIds) {
    const edge = graph.edges.get(eid);
    if (!edge) continue;
    if (levels.indexOf(edge.hazardLevel) > levels.indexOf(worstHazard))
      worstHazard = edge.hazardLevel;
  }

  return {
    nodeIds, edgeIds,
    totalCost: dist.get(endId)!,
    exitNodeId: endId,
    hazardLevel: worstHazard,
    computedAt: Date.now(),
  };
}

// ─── Public API ──────────────────────────────────────────────
export function findEvacuationPath(
  graph: BuildingGraph,
  sourceId: string,
  exitIds: string[],
): EvacuationPath | null {
  const { dist, prev, prevEdge } = dijkstra(graph, sourceId);
  let best: EvacuationPath | null = null;
  for (const eid of exitIds) {
    const path = reconstruct(eid, prev, prevEdge, dist, graph);
    if (!path) continue;
    if (!best || path.totalCost < best.totalCost) best = path;
  }
  return best;
}

export function computeAllPaths(graph: BuildingGraph): Map<string, EvacuationPath> {
  const result = new Map<string, EvacuationPath>();
  const exitIds = Array.from(graph.nodes.values()).filter(n => n.isExit).map(n => n.id);
  
  for (const [nodeId, node] of graph.nodes) {
    if (node.isExit) continue;
    const path = findEvacuationPath(graph, nodeId, exitIds);
    if (path) result.set(nodeId, path);
  }
  return result;
}
