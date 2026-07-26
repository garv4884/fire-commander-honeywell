'use client';

import React, { useState } from 'react';
import type { SensorReading, EvacuationPath } from '../core/types';
import {
  HAZARD_COLORS, HAZARD_FILL,
} from '../lib/building-config';
import { useMapStore } from '../core/MapContext';
import type { Node } from '../core/types';
import { ChevronUp, ChevronDown, Layers, ZoomIn, ZoomOut, Maximize, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useSigns } from '../core/SignsContext';
import { SmartSignMatrix } from './SmartSignMatrix';

interface Props {
  sensorData: Map<string, SensorReading>;
  paths: Map<string, EvacuationPath>;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string | null) => void;
  systemMode: string;
  showHeatmap?: boolean;
}

const NODE_RADIUS = 18;
const EXIT_RADIUS = 16;

function getHazardColor(nodeId: string, sensorData: Map<string, SensorReading>): string {
  const reading = sensorData.get(nodeId);
  if (!reading) return HAZARD_COLORS.SAFE;
  if (reading.temperature > 150 || reading.smokePpm > 800) return HAZARD_COLORS.BLOCKED;
  if (reading.temperature > 80 || reading.smokePpm > 500 || reading.flameDetected) return HAZARD_COLORS.DANGER;
  if (reading.temperature > 60 || reading.smokePpm > 300) return HAZARD_COLORS.WARNING;
  if (reading.temperature > 40 || reading.smokePpm > 100) return HAZARD_COLORS.CAUTION;
  return HAZARD_COLORS.SAFE;
}

function getHazardFill(nodeId: string, sensorData: Map<string, SensorReading>): string {
  const reading = sensorData.get(nodeId);
  if (!reading) return HAZARD_FILL.SAFE;
  if (reading.temperature > 150 || reading.smokePpm > 800) return HAZARD_FILL.BLOCKED;
  if (reading.temperature > 80 || reading.smokePpm > 500 || reading.flameDetected) return HAZARD_FILL.DANGER;
  if (reading.temperature > 60 || reading.smokePpm > 300) return HAZARD_FILL.WARNING;
  if (reading.temperature > 40 || reading.smokePpm > 100) return HAZARD_FILL.CAUTION;
  return HAZARD_FILL.SAFE;
}

function getPathNodeIds(paths: Map<string, EvacuationPath>): Set<string> {
  const ids = new Set<string>();
  for (const path of paths.values()) {
    for (const nid of path.nodeIds) ids.add(nid);
  }
  return ids;
}

function NodeCircle({
  node, isSelected, isOnPath, sensorData, showHeatmap, onClick,
}: {
  node: Node;
  isSelected: boolean;
  isOnPath: boolean;
  sensorData: Map<string, SensorReading>;
  showHeatmap?: boolean;
  onClick: () => void;
}) {
  const reading = sensorData.get(node.id);
  const occupancy = reading?.occupancy ?? 0;
  
  // Base colors
  let color = node.isExit ? '#10b981' : getHazardColor(node.id, sensorData);
  let fill  = node.isExit ? 'rgba(16,185,129,0.1)' : getHazardFill(node.id, sensorData);
  
  if (showHeatmap && !node.isExit) {
    if (occupancy === 0) {
      fill = 'rgba(200,200,200,0.1)';
      color = '#a3a3a3';
    } else if (occupancy <= 2) {
      fill = 'rgba(234,179,8,0.3)'; // Yellow-ish
      color = '#eab308';
    } else if (occupancy <= 4) {
      fill = 'rgba(249,115,22,0.4)'; // Orange-ish
      color = '#f97316';
    } else {
      fill = 'rgba(239,68,68,0.5)'; // Red-ish
      color = '#ef4444';
    }
  }

  const r = node.isExit ? EXIT_RADIUS : NODE_RADIUS;
  const hasFlame = reading?.flameDetected;
  const hasSevere = reading && (reading.temperature > 80 || reading.smokePpm > 500);

  return (
    <g id={`node-${node.id}`} onClick={onClick} style={{ cursor: 'pointer' }} transform={`translate(${node.x},${node.y})`}>
      {(isSelected || isOnPath) && (
        <circle
          r={r + 6}
          fill="none"
          stroke={isSelected ? 'var(--color-accent)' : '#3b82f6'}
          strokeWidth={2}
          opacity={0.6}
          strokeDasharray={isOnPath ? '4 2' : undefined}
        />
      )}
      {hasSevere && (
        <circle r={r + 10} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3} className="emergency" />
      )}
      <circle r={r} fill={fill} stroke={isSelected ? 'var(--color-accent)' : color} strokeWidth={isSelected ? 2.5 : 1.5} />
      {showHeatmap && !node.isExit && (
        <text y={4} textAnchor="middle" fontSize={11} fill={color} fontWeight="bold">
          {occupancy}
        </text>
      )}
      {!showHeatmap && node.isStairwell && <text y={4} textAnchor="middle" fontSize={12} fill="var(--color-muted)">⬆</text>}
      {!showHeatmap && hasFlame && <text y={-r - 6} textAnchor="middle" fontSize={14}>🔥</text>}
      {!showHeatmap && node.isExit && <text y={4} textAnchor="middle" fontSize={12} fill="#10b981">🚪</text>}
      <text
        y={r + 13} textAnchor="middle" fontSize={9} fill={node.isExit ? '#10b981' : 'var(--color-fg)'}
        fontWeight={isSelected ? '700' : '500'} fontFamily="var(--font-sans)"
      >
        {node.label.length > 10 ? node.label.slice(0, 10) + '…' : node.label}
      </text>
    </g>
  );
}

export default function FloorPlan({ sensorData, paths, selectedNodeId, onNodeClick, systemMode, showHeatmap }: Props) {
  const { nodes: BUILDING_NODES, edges: BUILDING_EDGES } = useMapStore();
  const { signs } = useSigns();
  const [activeFloor, setActiveFloor] = useState<0 | 1 | 2>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const activePaths = systemMode === 'NORMAL' || showHeatmap ? new Map<string, EvacuationPath>() : paths;
  const pathNodeIds = getPathNodeIds(activePaths);
  const nodeMap = new Map(BUILDING_NODES.map(n => [n.id, n]));

  const floorNodes = BUILDING_NODES.filter(n => n.floor === activeFloor);
  const minX = floorNodes.length ? Math.min(...floorNodes.map(n => n.x)) : 0;
  const maxX = floorNodes.length ? Math.max(...floorNodes.map(n => n.x)) : 600;
  const minY = floorNodes.length ? Math.min(...floorNodes.map(n => n.y)) : 0;
  const maxY = floorNodes.length ? Math.max(...floorNodes.map(n => n.y)) : 400;

  const padding = 60;
  const vbX = minX - padding;
  const vbY = minY - padding;
  const vbW = (maxX - minX) + padding * 2;
  const vbH = (maxY - minY) + padding * 2;

  const visibleNodes = BUILDING_NODES.filter(n => n.floor === activeFloor || n.isExit);
  
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
      
      {/* Floor Control UI */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-1 shadow-sm backdrop-blur">
        <div className="flex items-center gap-1.5 px-2 mr-1">
          <Layers size={14} className="text-[var(--color-muted)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Floor</span>
        </div>
        <button 
          onClick={() => setActiveFloor(2)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs transition-colors",
            activeFloor === 2 ? "bg-[var(--color-panel)] text-[var(--color-fg)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-muted)] hover:bg-[var(--color-border)]"
          )}
        >
          2
        </button>
        <button 
          onClick={() => setActiveFloor(1)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs transition-colors",
            activeFloor === 1 ? "bg-[var(--color-panel)] text-[var(--color-fg)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-muted)] hover:bg-[var(--color-border)]"
          )}
        >
          1
        </button>
        <button 
          onClick={() => setActiveFloor(0)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs transition-colors",
            activeFloor === 0 ? "bg-[var(--color-panel)] text-[var(--color-fg)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-muted)] hover:bg-[var(--color-border)]"
          )}
        >
          0
        </button>
      </div>

      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit={true}
        >
          {({ zoomIn, zoomOut, resetTransform, centerView, zoomToElement }) => (
            <>
              {/* Search Box */}
              <div className="absolute left-4 top-4 z-10 w-48">
                 <div className="relative">
                   <Search size={14} className="absolute left-2.5 top-2.5 text-[var(--color-muted)]" />
                   <input 
                     type="text" 
                     placeholder="Search node..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/90 py-1.5 pl-8 pr-3 text-xs text-[var(--color-fg)] backdrop-blur shadow-sm placeholder-[var(--color-muted)] outline-none focus:border-[var(--color-accent)]"
                   />
                 </div>
                 {searchQuery && (
                   <div className="absolute top-full left-0 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/95 backdrop-blur shadow-lg p-1">
                     {visibleNodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase())).map(n => (
                       <button
                         key={n.id}
                         onClick={() => {
                           onNodeClick(n.id);
                           setSearchQuery('');
                           zoomToElement(`node-${n.id}`, 2);
                         }}
                         className="w-full text-left px-2 py-1.5 text-xs text-[var(--color-fg)] hover:bg-[var(--color-accent)] hover:text-white rounded transition-colors"
                       >
                         {n.label}
                       </button>
                     ))}
                     {visibleNodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                       <div className="px-2 py-2 text-xs text-[var(--color-muted)] text-center">No results found on this floor.</div>
                     )}
                   </div>
                 )}
              </div>

              {/* Zoom Controls */}
              <div className="absolute left-4 bottom-4 z-10 flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-1 shadow-sm backdrop-blur">
                <button 
                  onClick={() => zoomIn()} 
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-fg)] transition-colors"
                  aria-label="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button 
                  onClick={() => zoomOut()} 
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-fg)] transition-colors"
                  aria-label="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <div className="w-px h-4 bg-[var(--color-border)] self-center mx-0.5" />
                <button 
                  onClick={() => resetTransform()} 
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-fg)] transition-colors"
                  aria-label="Reset View"
                >
                  <Maximize size={16} />
                </button>
              </div>

              <TransformComponent 
                wrapperStyle={{ width: "100%", height: "100%" }} 
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} 
                  className="w-full h-full"
                >
                  <defs>
                    <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
                      <path d="M0,0 L4,2 L0,4" fill="#3b82f6" />
                    </marker>
                  </defs>
                  
                  {/* Invisible background rect to catch clicks outside nodes */}
                  <rect 
                    x={vbX} y={vbY} width={vbW} height={vbH} 
                    fill="transparent" 
                    onClick={() => onNodeClick(null)}
                  />

                  <g>
                    {BUILDING_EDGES.map(edge => {
                      const fromN = nodeMap.get(edge.from);
                      const toN   = nodeMap.get(edge.to);
                      if (!fromN || !toN) return null;
                      if ((fromN.floor === activeFloor && toN.floor === activeFloor) || (fromN.isStairwell && toN.isStairwell && fromN.floor === activeFloor)) {
                         return (
                          <line
                            key={edge.id}
                            x1={fromN.x} y1={fromN.x === 560 && toN.x === 560 && fromN.floor !== toN.floor ? (activeFloor === 0 ? fromN.y + 20 : fromN.y - 20) : fromN.y}
                            x2={toN.x}   y2={fromN.x === 560 && toN.x === 560 && fromN.floor !== toN.floor ? (activeFloor === 0 ? 400 + 50 : 400 - 50) : toN.y}
                            stroke="var(--color-border)"
                            strokeWidth={2}
                            opacity={1}
                          />
                        );
                      }
                      return null;
                    })}

                    {(() => {
                      const uniqueSegments = new Map<string, { fromN: Node, toN: Node }>();
                      for (const path of activePaths.values()) {
                        if (path.nodeIds.length < 2) continue;
                        for (let i = 0; i < path.nodeIds.length - 1; i++) {
                          const fromN = nodeMap.get(path.nodeIds[i]);
                          const toN = nodeMap.get(path.nodeIds[i+1]);
                          if (fromN && toN && fromN.floor === activeFloor && toN.floor === activeFloor) {
                            uniqueSegments.set(`${fromN.id}->${toN.id}`, { fromN, toN });
                          }
                        }
                      }
                      
                      return Array.from(uniqueSegments.entries()).map(([key, { fromN, toN }]) => {
                        const dx = toN.x - fromN.x;
                        const dy = toN.y - fromN.y;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        const r = toN.isExit ? 16 : 18; // EXIT_RADIUS / NODE_RADIUS
                        const offset = r + 8; // Offset so arrowhead sits just outside the node border
                        const ratio = len > offset ? (len - offset) / len : 1;
                        const x2 = fromN.x + dx * ratio;
                        const y2 = fromN.y + dy * ratio;

                        return (
                          <line
                            key={`path-segment-${key}`}
                            x1={fromN.x} y1={fromN.y} x2={x2} y2={y2}
                            stroke="#3b82f6" strokeWidth={4} strokeLinecap="round" className="path-animated" strokeDasharray="10 6"
                            markerEnd="url(#arrowhead)"
                          />
                        );
                      });
                    })()}
                    
                    {visibleNodes.map(node => (
                      <NodeCircle
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeId === node.id}
                        isOnPath={pathNodeIds.has(node.id)}
                        sensorData={sensorData}
                        showHeatmap={showHeatmap}
                        onClick={() => onNodeClick(node.id)}
                      />
                    ))}

                    {/* Node Popup overlay inside SVG */}
                    {selectedNodeId && visibleNodes.find(n => n.id === selectedNodeId) && (
                      (() => {
                        const selNode = visibleNodes.find(n => n.id === selectedNodeId)!;
                        const reading = sensorData.get(selNode.id);
                        const sign = signs.find(s => s.nodeId === selNode.id);
                        const popupW = 260;
                        const popupH = sign ? 280 : 120;
                        let px = selNode.x + 20;
                        let py = selNode.y - popupH / 2;
                        // basic bounding box keep-in-view logic could go here, but simple offset is fine
                        return (
                          <foreignObject x={px} y={py} width={popupW} height={popupH} style={{ overflow: 'visible' }}>
                            <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-md bg-opacity-95 z-50 pointer-events-none">
                               <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-2">
                                 <div className="flex flex-col">
                                   <span className="text-xs font-bold text-[var(--color-fg)]">{selNode.label}</span>
                                   <span className="text-[10px] text-[var(--color-muted)] font-mono">{selNode.id}</span>
                                 </div>
                                 {reading && reading.flameDetected && <span className="text-sm">🔥</span>}
                               </div>
                               <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--color-muted)]">
                                 <div className="flex flex-col bg-[var(--color-panel-2)] p-1.5 rounded">
                                   <span>Temp</span>
                                   <span className="text-xs font-bold text-[var(--color-fg)]">{reading ? reading.temperature.toFixed(1) : '--'}°C</span>
                                 </div>
                                 <div className="flex flex-col bg-[var(--color-panel-2)] p-1.5 rounded">
                                   <span>Smoke</span>
                                   <span className="text-xs font-bold text-[var(--color-fg)]">{reading ? reading.smokePpm.toFixed(0) : '--'} ppm</span>
                                 </div>
                                 <div className="col-span-2 flex justify-between items-center bg-[var(--color-panel-2)] p-1.5 rounded">
                                   <span>Occupancy</span>
                                   <span className="text-xs font-bold text-[var(--color-fg)]">{reading ? reading.occupancy : 0} persons</span>
                                 </div>
                                 {paths.get(selNode.id) && (
                                   <div className="col-span-2 flex justify-between items-center bg-[var(--color-panel-2)] p-1.5 rounded border border-[var(--color-border)]/50">
                                     <span>Path Cost</span>
                                     <span className="text-xs font-bold text-[var(--color-accent)] font-mono">{paths.get(selNode.id)!.totalCost.toFixed(0)} units</span>
                                   </div>
                                 )}
                               </div>
                               {sign ? (
                                 <div className="flex flex-col items-center mt-2 border-t border-[var(--color-border)] pt-3">
                                   <span className="text-[9px] uppercase font-bold text-[var(--color-muted)] mb-2 tracking-wider">Live Sign Output</span>
                                   <SmartSignMatrix path={paths.get(selNode.id)} systemMode={systemMode} size="sm" className="shadow-inner scale-[0.85] origin-top" />
                                 </div>
                               ) : (
                                 <div className="mt-1 text-[9px] text-center text-[var(--color-muted)] italic">
                                   No smart hardware installed in this zone.
                                 </div>
                               )}
                            </div>
                          </foreignObject>
                        );
                      })()
                    )}
                  </g>
                </svg>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
}
