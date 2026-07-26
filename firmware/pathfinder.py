"""
pathfinder.py — Lightweight Dijkstra for ESP32 (MicroPython)
Optimised for minimal heap usage on 520KB SRAM.
"""

from config import NODES, EDGES, EXIT_NODES


def _build_adjacency(nodes, edges):
    """Build adjacency list: {node_id: [(neighbour_id, base_weight)]}"""
    adj = {nid: [] for nid in nodes}
    for (frm, to, w) in edges:
        adj[frm].append((to, w))
        adj[to].append((frm, w))
    return adj


# Pre-build adjacency at module load (runs once on boot)
_ADJ = _build_adjacency(NODES, EDGES)


class _MinHeap:
    """Minimal binary min-heap for MicroPython (no heapq in all builds)."""
    def __init__(self):
        self._h = []

    def push(self, priority, value):
        self._h.append((priority, value))
        self._bubble_up(len(self._h) - 1)

    def pop(self):
        if not self._h:
            return None
        top = self._h[0]
        last = self._h.pop()
        if self._h:
            self._h[0] = last
            self._sink_down(0)
        return top

    def __len__(self):
        return len(self._h)

    def _bubble_up(self, i):
        while i > 0:
            p = (i - 1) >> 1
            if self._h[p][0] <= self._h[i][0]:
                break
            self._h[p], self._h[i] = self._h[i], self._h[p]
            i = p

    def _sink_down(self, i):
        n = len(self._h)
        while True:
            sm = i
            l, r = 2*i+1, 2*i+2
            if l < n and self._h[l][0] < self._h[sm][0]: sm = l
            if r < n and self._h[r][0] < self._h[sm][0]: sm = r
            if sm == i: break
            self._h[i], self._h[sm] = self._h[sm], self._h[i]
            i = sm


def dijkstra(source_id, weights=None):
    """
    Run Dijkstra from source_id.

    Args:
        source_id: str — starting node
        weights:   dict {(from,to): float} — live fused weights.
                   If None, uses base weights from EDGES.
                   Infinity means edge is blocked.

    Returns:
        (dist: dict, prev: dict)
    """
    dist    = {nid: float('inf') for nid in NODES}
    prev    = {nid: None for nid in NODES}
    visited = set()
    pq      = _MinHeap()

    dist[source_id] = 0.0
    pq.push(0.0, source_id)

    while len(pq) > 0:
        cost, u = pq.pop()
        if u in visited:
            continue
        visited.add(u)

        for (v, base_w) in _ADJ.get(u, []):
            # Prefer live fused weights if provided
            if weights is not None:
                w = weights.get((u, v), weights.get((v, u), base_w))
            else:
                w = base_w

            if w == float('inf'):
                continue

            nd = cost + w
            if nd < dist[v]:
                dist[v]  = nd
                prev[v]  = u
                pq.push(nd, v)

    return dist, prev


def _reconstruct(end_id, prev):
    """Reconstruct the node path list from Dijkstra prev map."""
    path = []
    cursor = end_id
    while cursor is not None:
        path.append(cursor)
        cursor = prev[cursor]
    path.reverse()
    return path


def find_evacuation_path(source_id, weights=None):
    """
    Find safest path from source_id to the nearest exit.

    Returns:
        {'path': [node_id, ...], 'cost': float, 'exit': str} | None
    """
    if source_id not in NODES:
        print(f'[Pathfinder] Unknown node: {source_id}')
        return None

    import utime
    t0 = utime.ticks_ms()

    dist, prev = dijkstra(source_id, weights)

    best_exit = None
    best_cost = float('inf')
    for eid in EXIT_NODES:
        c = dist.get(eid, float('inf'))
        if c < best_cost:
            best_cost = c
            best_exit = eid

    elapsed = utime.ticks_diff(utime.ticks_ms(), t0)
    if elapsed > 300:
        print(f'[Pathfinder] WARNING: took {elapsed}ms (must be <300ms)')

    if best_exit is None or best_cost == float('inf'):
        print('[Pathfinder] No reachable exit found!')
        return None

    path = _reconstruct(best_exit, prev)
    return {'path': path, 'cost': best_cost, 'exit': best_exit}


def find_fallback_path(source_id):
    """Use base weights only (no sensor data) — for fail-safe mode."""
    return find_evacuation_path(source_id, weights=None)
