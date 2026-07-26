'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SensorReading, EvacuationPath, EventLogEntry, SimulationState,
} from '../core/types';
import { useMapStore } from '../core/MapContext';
import { buildGraph, computeAllPaths } from '../lib/pathfinder';
import { updateAllEdgeWeights, classifyHazard, defaultReading } from '../lib/sensor-fusion';
import { fireSimulator } from '../lib/fire-simulator';
import type { BuildingGraph } from '../core/types';

import FloorPlan         from '../components/FloorPlan';
import SensorGauges      from '../components/SensorGauges';
import EventTimeline     from '../components/EventTimeline';
import SystemStatus      from '../components/SystemStatus';

// removed makeDefaultSensorData

let eventIdCounter = 0;
function makeEvent(level: EventLogEntry['level'], message: string, nodeId?: string, zoneLabel?: string): EventLogEntry {
  return { id: String(++eventIdCounter), timestamp: Date.now(), level, message, nodeId, zoneLabel };
}

export default function DashboardPage() {
  const { nodes: BUILDING_NODES, edges: BUILDING_EDGES } = useMapStore();
  const graphRef = useRef<BuildingGraph>(buildGraph(BUILDING_NODES, BUILDING_EDGES));
  
  useEffect(() => {
    graphRef.current = buildGraph(BUILDING_NODES, BUILDING_EDGES);
  }, [BUILDING_NODES, BUILDING_EDGES]);

  const [sensorData, setSensorData]   = useState<Map<string, SensorReading>>(() => fireSimulator.getCurrentReadings());
  const [paths, setPaths]             = useState<Map<string, EvacuationPath>>(() => new Map(computeAllPaths(graphRef.current)));
  const [events, setEvents]           = useState<EventLogEntry[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [systemMode, setSystemMode] = useState<'NORMAL' | 'DEGRADED' | 'ISOLATED' | 'EMERGENCY'>('NORMAL');
  const [simState, setSimState] = useState<SimulationState>(() => fireSimulator.getState());
  const [alertCount, setAlertCount] = useState(0);
  const [livesAtRisk, setLivesAtRisk] = useState(0);
  const [lastUpdateMs, setLastUpdateMs] = useState(Date.now());
  const [showHeatmap, setShowHeatmap] = useState(false);
  const prevPathsRef = useRef<Map<string, EvacuationPath>>(new Map());

  const runUpdate = useCallback((newData: Map<string, SensorReading>) => {
    const graph = graphRef.current;
    updateAllEdgeWeights(graph, newData);
    const newPaths = computeAllPaths(graph);
    setPaths(new Map(newPaths));

    let alerts = 0;
    let emergency = false;
    let riskCount = 0;
    const newEvents: EventLogEntry[] = [];

    for (const [nodeId, reading] of newData) {
      const node = BUILDING_NODES.find(n => n.id === nodeId);
      if (!node || node.isExit) continue;
      const hazard = classifyHazard(reading);
      if (hazard === 'DANGER' || hazard === 'BLOCKED') {
        alerts++;
        emergency = emergency || hazard === 'BLOCKED' || reading.flameDetected;
        riskCount += (reading.occupancy || 0);
      }
      // Log high-occupancy events for path weight optimization awareness
      if (reading.occupancy > 4) {
        newEvents.push(makeEvent('WARNING',
          `High occupancy (${reading.occupancy}) detected in ${node.label} — path weight increased`,
          nodeId, node.label,
        ));
      }
    }

    setAlertCount(alerts);
    setLivesAtRisk(riskCount);
    setSystemMode(emergency ? 'EMERGENCY' : alerts > 0 ? 'DEGRADED' : 'NORMAL');

    for (const [srcId, newPath] of newPaths) {
      const prevPath = prevPathsRef.current.get(srcId);
      if (prevPath && prevPath.exitNodeId !== newPath.exitNodeId) {
        const srcNode = BUILDING_NODES.find(n => n.id === srcId);
        const exitNode = BUILDING_NODES.find(n => n.id === newPath.exitNodeId);
        newEvents.push(makeEvent(
          'WARNING',
          `Path rerouted: ${srcNode?.label ?? srcId} → ${exitNode?.label ?? newPath.exitNodeId}`,
          srcId, srcNode?.label,
        ));
      }
    }

    if (newEvents.length > 0) {
      setEvents(prev => {
        const updated = [...prev, ...newEvents].slice(-100);
        localStorage.setItem('fire_cmd_events', JSON.stringify(updated));
        return updated;
      });
    }
    prevPathsRef.current = newPaths;
    setLastUpdateMs(Date.now());
  }, []);

  useEffect(() => {
    // Initial sync in case state changed while unmounted (e.g. injected fault)
    const initialReadings = fireSimulator.getCurrentReadings();
    setSensorData(new Map(initialReadings));
    setSimState(fireSimulator.getState());
    
    setEvents([
      makeEvent('INFO', 'Fire Commander Dashboard started. All systems nominal.'),
      makeEvent('INFO', 'Building graph loaded: 26 nodes, 36 edges, 3 exits.'),
    ]);
    
    runUpdate(initialReadings);

    fireSimulator.onSensorUpdate((readings) => {
      setSensorData(new Map(readings));
      setSimState(fireSimulator.getState());
      runUpdate(readings);
    });
  }, [runUpdate]);

  const topNodes = BUILDING_NODES.filter(n => !n.isExit).slice(0, 6);
  const gaugeNodes = selectedNodeId
    ? [BUILDING_NODES.find(n => n.id === selectedNodeId)!, ...topNodes.filter(n => n.id !== selectedNodeId)].slice(0, 4)
    : topNodes.slice(0, 4);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10 pt-4 md:pt-2">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">Dashboard Overview</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Real-time status of the Dynamic Evacuation Router. All {BUILDING_NODES.length} nodes connected.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Live Hazard Map (Spans 2 columns on Desktop) */}
        <div className="lg:col-span-2 card-md p-5 flex flex-col h-[520px] fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="section-label mb-0">Live Hazard Map</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--color-fg)]">
                <input 
                  type="checkbox" 
                  checked={showHeatmap} 
                  onChange={e => setShowHeatmap(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                Thermal / Occupancy Heatmap
              </label>
            </div>
            <div className="flex-1 bg-[var(--color-panel-2)] rounded-xl border border-[var(--color-border)] overflow-hidden relative">
              <FloorPlan
                sensorData={sensorData}
                paths={(systemMode === 'NORMAL' && !simState.isRunning && simState.manualOverrides.size === 0) ? new Map() : paths}
                selectedNodeId={selectedNodeId}
                onNodeClick={setSelectedNodeId}
                systemMode={systemMode}
                showHeatmap={showHeatmap}
              />
            </div>
          </div>

        {/* 2. System Health (Spans 1 column on Desktop) */}
        <div className="lg:col-span-1 card-md flex flex-col h-[520px] overflow-hidden fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-4 border-b border-[var(--color-border)] shrink-0">
            <span className="section-label mb-0">System Health</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <SystemStatus
              systemMode={systemMode}
              connectedNodes={['node_1', 'node_2', 'node_3']}
              alertCount={alertCount}
              lastUpdateMs={lastUpdateMs}
              activePathCount={paths.size}
              simRunning={simState.isRunning}
              simScenario={simState.scenario?.name ?? null}
              livesAtRisk={livesAtRisk}
            />
          </div>
        </div>

        {/* 3. Critical Zones Sensors (Spans 2 columns on Desktop) */}
        <div className="lg:col-span-2 card-md p-5 fade-up self-start" style={{ animationDelay: '0.3s' }}>
          <span className="section-label block mb-4">Critical Zones Sensors</span>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {gaugeNodes.map(node => (
              <div key={node.id} className="bg-[var(--color-panel-2)] rounded-xl border border-[var(--color-border)] overflow-hidden shrink-0 w-[280px] snap-start">
                <SensorGauges
                  nodeId={node.id}
                  nodeLabel={node.label}
                  reading={sensorData.get(node.id) ?? null}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4. Event Timeline (Spans 1 column on Desktop) */}
        <div className="lg:col-span-1 card-md flex flex-col fade-up h-[300px] sm:h-[320px]" style={{ animationDelay: '0.4s' }}>
          <div className="p-4 border-b border-[var(--color-border)] shrink-0">
            <span className="section-label mb-0">Event Timeline</span>
          </div>
          <div className="overflow-y-auto p-4 flex-1">
            <EventTimeline events={events} />
          </div>
        </div>

      </div>
    </div>
  );
}
