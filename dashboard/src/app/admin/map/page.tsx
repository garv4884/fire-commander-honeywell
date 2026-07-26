'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '../../../core/MapContext';
import { useAdmin } from '../../../core/AdminContext';
import { useRouter } from 'next/navigation';
import type { Node, Edge } from '../../../core/types';
import { Plus, Trash, Save, RotateCcw, MousePointer2, GitCommit, Move, Layers } from 'lucide-react';
import { cn } from '../../../lib/utils';

type EditorMode = 'select' | 'addNode' | 'drawEdge';

const NODE_R = 18;
const EXIT_R = 16;
const PADDING = 60;

export default function MapEditorPage() {
  const { nodes, edges, saveGraph, resetGraph } = useMapStore();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  const [draftNodes, setDraftNodes] = useState<Node[]>([]);
  const [draftEdges, setDraftEdges] = useState<Edge[]>([]);
  const [mode, setMode] = useState<EditorMode>('select');
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeDrawSource, setEdgeDrawSource] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  useEffect(() => {
    if (!isAdmin) router.push('/admin');
  }, [isAdmin, router]);

  useEffect(() => {
    const loaded = [...nodes];
    setDraftNodes(loaded);
    setDraftEdges([...edges]);
    // Initialize activeFloor to the first non-exit floor found in the data
    const floors = Array.from(new Set(loaded.filter(n => !n.isExit).map(n => n.floor))).sort();
    if (floors.length > 0) setActiveFloor(floors[0]);
  }, [nodes, edges]);

  // ── Derived geometry ─────────────────────────────────────
  // Only show nodes on the current floor — exits are floor-specific too
  const floorNodes = draftNodes.filter(n => n.floor === activeFloor);
  const nodeMap = new Map(draftNodes.map(n => [n.id, n]));

  // Unique sorted floor list from actual data
  const availableFloors = Array.from(new Set(draftNodes.map(n => n.floor))).sort();

  const allX = floorNodes.map(n => n.x);
  const allY = floorNodes.map(n => n.y);
  const minX = allX.length ? Math.min(...allX) : 0;
  const maxX = allX.length ? Math.max(...allX) : 600;
  const minY = allY.length ? Math.min(...allY) : 0;
  const maxY = allY.length ? Math.max(...allY) : 400;
  const vbX = minX - PADDING;
  const vbY = minY - PADDING;
  const vbW = Math.max((maxX - minX) + PADDING * 2, 400);
  const vbH = Math.max((maxY - minY) + PADDING * 2, 400);

  // ── Coordinate conversion ─────────────────────────────────
  const svgPointFromEvent = useCallback((e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = vbW / rect.width;
    const scaleY = vbH / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX + vbX,
      y: (e.clientY - rect.top) * scaleY + vbY,
    };
  }, [vbW, vbH, vbX, vbY]);

  // ── Selection ──────────────────────────────────────────────
  const selectedNode = draftNodes.find(n => n.id === selectedNodeId) ?? null;
  const selectedEdge = draftEdges.find(e => e.id === selectedEdgeId) ?? null;

  const selectNode = (id: string) => {
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setEdgeDrawSource(null);
  };
  const selectEdge = (id: string) => {
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
  };
  const clearSelection = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEdgeDrawSource(null);
  };

  // ── Mouse handlers ─────────────────────────────────────────
  const handleNodeMouseDown = useCallback((e: React.MouseEvent<SVGGElement>, nodeId: string) => {
    e.stopPropagation();

    if (mode === 'select') {
      selectNode(nodeId);
      const node = draftNodes.find(n => n.id === nodeId)!;
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = vbW / rect.width;
        const scaleY = vbH / rect.height;
        const ptX = (e.clientX - rect.left) * scaleX + vbX;
        const ptY = (e.clientY - rect.top) * scaleY + vbY;
        dragOffset.current = { dx: ptX - node.x, dy: ptY - node.y };
      }
      setDraggingNodeId(nodeId);
    } else if (mode === 'drawEdge') {
      if (!edgeDrawSource) {
        setEdgeDrawSource(nodeId);
        setSelectedNodeId(null); // Don't open properties when picking source
        setSelectedEdgeId(null);
      } else if (edgeDrawSource !== nodeId) {
        // Create edge
        const id = `E_${Date.now()}`;
        setDraftEdges(prev => [...prev, {
          id,
          from: edgeDrawSource,
          to: nodeId,
          baseWeight: 10,
          currentWeight: 10,
          isBlocked: false,
          hazardLevel: 'SAFE',
        }]);
        setEdgeDrawSource(null);
        setMode('select');
        selectNode(nodeId);
      }
    }
  }, [mode, draftNodes, edgeDrawSource, svgPointFromEvent]);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId) return;
    const pt = svgPointFromEvent(e);
    if (!pt) return;
    const snapped = { x: Math.round((pt.x - dragOffset.current.dx) / 10) * 10, y: Math.round((pt.y - dragOffset.current.dy) / 10) * 10 };
    setDraftNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: snapped.x, y: snapped.y } : n));
  }, [draggingNodeId, svgPointFromEvent]);

  const handleSvgMouseUp = useCallback(() => {
    setDraggingNodeId(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'addNode') {
      clearSelection();
      return;
    }
    const pt = svgPointFromEvent(e);
    if (!pt) return;
    const id = `N_${Date.now()}`;
    const newNode: Node = {
      id, label: 'New Node', floor: activeFloor,
      x: Math.round(pt.x / 10) * 10,
      y: Math.round(pt.y / 10) * 10,
      isExit: false, hazardLevel: 'SAFE',
    };
    setDraftNodes(prev => [...prev, newNode]);
    setMode('select');
    selectNode(id);
  }, [mode, svgPointFromEvent, activeFloor]);

  // ── Edit helpers ──────────────────────────────────────────
  const updateNode = (id: string, field: keyof Node, value: any) => {
    setDraftNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const deleteNode = (id: string) => {
    setDraftNodes(prev => prev.filter(n => n.id !== id));
    setDraftEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    clearSelection();
  };

  const deleteEdge = (id: string) => {
    setDraftEdges(prev => prev.filter(e => e.id !== id));
    clearSelection();
  };

  const updateEdge = (id: string, field: keyof Edge, value: any) => {
    setDraftEdges(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = () => {
    saveGraph(draftNodes, draftEdges);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset to default building layout? All custom changes will be lost.')) {
      resetGraph();
    }
  };

  // ── Keyboard delete ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if typing in an input field (e.g. changing weight or node label)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) deleteNode(selectedNodeId);
        else if (selectedEdgeId) deleteEdge(selectedEdgeId);
      }
      if (e.key === 'Escape') {
        setMode('select');
        setEdgeDrawSource(null);
        clearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedNodeId, selectedEdgeId]);

  if (!isAdmin) return null;

  // visibleEdges: edges where BOTH endpoints are on the active floor
  const visibleEdges = draftEdges.filter(edge => {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) return false;
    return from.floor === activeFloor && to.floor === activeFloor;
  });

  return (
    <div className="flex flex-col h-full gap-0 w-full max-w-full mx-auto">
      
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] shrink-0 fade-up">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-fg)] leading-tight">Visual Map Editor</h1>
          <p className="text-[11px] text-[var(--color-muted)]">Drag nodes • Draw edges • Click canvas to add</p>
        </div>

        <div className="h-6 w-px bg-[var(--color-border)] mx-1" />

        {/* Mode Buttons */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-1">
          <button
            onClick={() => { setMode('select'); setEdgeDrawSource(null); }}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors', mode === 'select' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]')}
            title="Select & Drag (S)"
          >
            <MousePointer2 size={14} /> Select
          </button>
          <button
            onClick={() => { setMode('addNode'); setEdgeDrawSource(null); clearSelection(); }}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors', mode === 'addNode' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]')}
            title="Add Node (N)"
          >
            <Plus size={14} /> Add Node
          </button>
          <button
            onClick={() => { setMode('drawEdge'); setSelectedEdgeId(null); }}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors', mode === 'drawEdge' ? 'bg-purple-600 text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]')}
            title="Draw Edge (E)"
          >
            <GitCommit size={14} /> Draw Edge
          </button>
        </div>

        {/* Floor selector — auto-generated from actual data */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-1 ml-1">
          <Layers size={14} className="text-[var(--color-muted)] ml-1" />
          {availableFloors.map(f => (
            <button key={f} onClick={() => setActiveFloor(f)}
              className={cn('h-7 px-3 rounded-md font-bold text-xs whitespace-nowrap transition-colors', activeFloor === f ? 'bg-[var(--color-panel)] text-[var(--color-fg)] shadow-sm border border-[var(--color-border)]' : 'text-[var(--color-muted)] hover:bg-[var(--color-border)]')}
            >
              Floor {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto text-[11px] text-[var(--color-muted)]">
          <span>{draftNodes.length} nodes</span>
          <span className="mx-1">·</span>
          <span>{draftEdges.length} edges</span>
        </div>

        <button onClick={handleReset} className="btn-secondary text-red-500 hover:border-red-500/50 hover:bg-red-500/10 text-xs">
          <RotateCcw size={14} /> Reset
        </button>
        <button onClick={handleSave} className={cn('btn-primary text-xs transition-all', saved && 'bg-emerald-600 hover:bg-emerald-700')}>
          <Save size={14} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Status bar */}
      {(mode === 'addNode' || mode === 'drawEdge') && (
        <div className={cn('px-4 py-2 text-xs font-bold text-center shrink-0', mode === 'addNode' ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]' : 'bg-purple-600/15 text-purple-400')}>
          {mode === 'addNode' && '📍 Click anywhere on the canvas to place a new node. Press Esc to cancel.'}
          {mode === 'drawEdge' && !edgeDrawSource && '🔗 Click the SOURCE node to start drawing an edge. Press Esc to cancel.'}
          {mode === 'drawEdge' && edgeDrawSource && `🔗 Source: "${nodeMap.get(edgeDrawSource)?.label}". Now click the DESTINATION node.`}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">

        {/* Canvas */}
        <div className="flex-1 relative bg-[var(--color-panel-2)] overflow-hidden"
          style={{ cursor: mode === 'addNode' ? 'crosshair' : mode === 'drawEdge' ? 'cell' : draggingNodeId ? 'grabbing' : 'default' }}
        >
          {/* Grid dots */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="var(--color-border)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <svg
            ref={svgRef}
            className="w-full h-full select-none"
            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
            onClick={handleCanvasClick}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
          >
            {/* Edges */}
            {visibleEdges.map(edge => {
              const from = nodeMap.get(edge.from);
              const to = nodeMap.get(edge.to);
              if (!from || !to) return null;
              const isSelectedEdge = selectedEdgeId === edge.id;
              return (
                <g key={edge.id} onClick={e => { e.stopPropagation(); selectEdge(edge.id); }}>
                  {/* Fat invisible hitbox */}
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="transparent" strokeWidth={16} className="cursor-pointer" />
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={isSelectedEdge ? 'var(--color-accent)' : 'var(--color-border)'}
                    strokeWidth={isSelectedEdge ? 3 : 2}
                    strokeDasharray={isSelectedEdge ? '6 3' : undefined}
                  />
                  {/* Weight label */}
                  <text
                    x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}
                    textAnchor="middle" fontSize={9} fill="var(--color-muted)"
                    fontFamily="var(--font-mono)" className="pointer-events-none"
                  >
                    {edge.baseWeight}
                  </text>
                </g>
              );
            })}

            {/* Edge draw preview line */}
            {edgeDrawSource && nodeMap.get(edgeDrawSource) && (
              <line
                x1={nodeMap.get(edgeDrawSource)!.x}
                y1={nodeMap.get(edgeDrawSource)!.y}
                x2={nodeMap.get(edgeDrawSource)!.x + 40}
                y2={nodeMap.get(edgeDrawSource)!.y + 40}
                stroke="rgb(139,92,246)" strokeWidth={2} strokeDasharray="5 3" opacity={0.7}
              />
            )}

            {/* Nodes */}
            {floorNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isEdgeSource = edgeDrawSource === node.id;
              const color = node.isExit ? '#10b981' : 'var(--color-accent)';
              const r = node.isExit ? EXIT_R : NODE_R;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  onClick={e => e.stopPropagation()}
                  style={{ cursor: mode === 'select' ? 'grab' : 'pointer' }}
                >
                  {/* Selection / source highlight */}
                  {(isSelected || isEdgeSource) && (
                    <circle r={r + 8} fill="none"
                      stroke={isEdgeSource ? 'rgb(139,92,246)' : 'var(--color-accent)'}
                      strokeWidth={2} opacity={0.5}
                    />
                  )}
                  <circle r={r}
                    fill={node.isExit ? 'rgba(16,185,129,0.15)' : isSelected ? 'rgba(99,102,241,0.15)' : 'var(--color-panel)'}
                    stroke={isSelected ? 'var(--color-accent)' : color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text y={4} textAnchor="middle" fontSize={9} fill="var(--color-muted)" fontFamily="var(--font-mono)" className="pointer-events-none">
                    {node.isExit ? '🚪' : node.isStairwell ? '⬆' : ''}
                  </text>
                  <text y={r + 13} textAnchor="middle" fontSize={9}
                    fill={node.isExit ? '#10b981' : 'var(--color-fg)'}
                    fontWeight={isSelected ? '700' : '500'} fontFamily="var(--font-sans)"
                    className="pointer-events-none"
                  >
                    {node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Empty state */}
          {floorNodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-muted)] pointer-events-none">
              <Move size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-semibold">No nodes on this floor</p>
              <p className="text-xs">Switch to "Add Node" mode and click to place nodes</p>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <div className="w-[280px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-[var(--color-border)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Properties</span>
          </div>

          {!selectedNode && !selectedEdge && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center text-[var(--color-muted)]">
              <MousePointer2 size={32} className="opacity-30" />
              <p className="text-sm font-semibold">Nothing selected</p>
              <p className="text-xs leading-relaxed">Click a node or edge on the canvas to edit its properties.</p>
              <div className="mt-4 flex flex-col gap-2 text-xs text-left w-full border border-[var(--color-border)] rounded-lg p-3">
                <div className="font-bold text-[var(--color-fg)] mb-1">Keyboard Shortcuts</div>
                <div className="flex justify-between"><span>Delete selected</span><kbd className="bg-[var(--color-panel-2)] px-1 rounded">Del</kbd></div>
                <div className="flex justify-between"><span>Cancel / Deselect</span><kbd className="bg-[var(--color-panel-2)] px-1 rounded">Esc</kbd></div>
              </div>
            </div>
          )}

          {selectedNode && (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-fg)]">Node: <span className="font-mono text-[var(--color-accent)]">{selectedNode.id}</span></span>
                <button onClick={() => deleteNode(selectedNode.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" title="Delete node">
                  <Trash size={14} />
                </button>
              </div>

              <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-[var(--color-muted)]">
                Label
                <input value={selectedNode.label} onChange={e => updateNode(selectedNode.id, 'label', e.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]" />
              </label>

              <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-[var(--color-muted)]">
                Floor
                <select value={selectedNode.floor} onChange={e => updateNode(selectedNode.id, 'floor', parseInt(e.target.value))}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]">
                  <option value={0}>Floor 0</option>
                  <option value={1}>Floor 1</option>
                  <option value={2}>Floor 2</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-[var(--color-muted)]">
                  X
                  <input type="number" value={selectedNode.x} onChange={e => {
                      const val = parseInt(e.target.value);
                      updateNode(selectedNode.id, 'x', isNaN(val) ? 0 : val);
                    }}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)] font-mono" />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-[var(--color-muted)]">
                  Y
                  <input type="number" value={selectedNode.y} onChange={e => {
                      const val = parseInt(e.target.value);
                      updateNode(selectedNode.id, 'y', isNaN(val) ? 0 : val);
                    }}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)] font-mono" />
                </label>
              </div>

              <div className="flex flex-col gap-3 pt-3 border-t border-[var(--color-border)]">
                <label className="flex items-center gap-3 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedNode.isExit} onChange={e => updateNode(selectedNode.id, 'isExit', e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-emerald-500 focus:ring-emerald-500" />
                  <span className="font-semibold text-[var(--color-fg)]">Exit Node</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm">
                  <input type="checkbox" checked={!!selectedNode.isStairwell} onChange={e => updateNode(selectedNode.id, 'isStairwell', e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-blue-500 focus:ring-blue-500" />
                  <span className="font-semibold text-[var(--color-fg)]">Stairwell</span>
                </label>
              </div>
            </div>
          )}

          {selectedEdge && (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-fg)]">Edge: <span className="font-mono text-purple-400">{selectedEdge.id}</span></span>
                <button onClick={() => deleteEdge(selectedEdge.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" title="Delete edge">
                  <Trash size={14} />
                </button>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-[var(--color-muted)]">
                  <span className="font-bold text-[var(--color-fg)]">{nodeMap.get(selectedEdge.from)?.label ?? selectedEdge.from}</span>
                  <span>→</span>
                  <span className="font-bold text-[var(--color-fg)]">{nodeMap.get(selectedEdge.to)?.label ?? selectedEdge.to}</span>
                </div>
              </div>

              <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-[var(--color-muted)]">
                From Node
                <select value={selectedEdge.from} onChange={e => updateEdge(selectedEdge.id, 'from', e.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]">
                  {draftNodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-[var(--color-muted)]">
                To Node
                <select value={selectedEdge.to} onChange={e => updateEdge(selectedEdge.id, 'to', e.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]">
                  {draftNodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-[var(--color-muted)]">
                Base Weight (traversal cost)
                <input type="number" min={1} max={999} value={selectedEdge.baseWeight}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    updateEdge(selectedEdge.id, 'baseWeight', isNaN(val) ? 1 : val);
                  }}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)] font-mono" />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
