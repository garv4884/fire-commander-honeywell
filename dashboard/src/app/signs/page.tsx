'use client';

import React, { useEffect, useState } from 'react';
import { fireSimulator } from '../../lib/fire-simulator';
import { Shield, Monitor, Plus, Trash, Wifi, Activity, XCircle } from 'lucide-react';
import type { EvacuationPath } from '../../core/types';
import { computeAllPaths, buildGraph } from '../../lib/pathfinder';
import { updateAllEdgeWeights, classifyHazard } from '../../lib/sensor-fusion';
import { useMapStore } from '../../core/MapContext';
import { useAdmin } from '../../core/AdminContext';
import { useSigns } from '../../core/SignsContext';
import { SmartSignMatrix } from '../../components/SmartSignMatrix';

export default function SignsPage() {
  const { nodes, edges } = useMapStore();
  const { isAdmin } = useAdmin();
  const { signs, addSign, removeSign } = useSigns();
  const [paths, setPaths] = useState<Map<string, EvacuationPath>>(new Map());
  const [newSignNodeId, setNewSignNodeId] = useState('');
  const [systemMode, setSystemMode] = useState<'NORMAL' | 'DEGRADED' | 'EMERGENCY'>('NORMAL');

  useEffect(() => {
    const updatePaths = (readings?: Map<string, any>) => {
      const graph = buildGraph(nodes, edges);
      const currentReadings = readings || new Map(fireSimulator.getCurrentReadings());
      updateAllEdgeWeights(graph, currentReadings);
      setPaths(new Map(computeAllPaths(graph)));

      let alerts = 0;
      let emergency = false;
      for (const reading of currentReadings.values()) {
        const hazard = classifyHazard(reading);
        if (hazard === 'DANGER' || hazard === 'BLOCKED') {
          alerts++;
          emergency = emergency || hazard === 'BLOCKED' || reading.flameDetected;
        }
      }
      setSystemMode(emergency ? 'EMERGENCY' : alerts > 0 ? 'DEGRADED' : 'NORMAL');
    };

    // Initial compute
    updatePaths();
    
    // Subscribe to simulator ticks
    fireSimulator.onSensorUpdate((readings) => {
      updatePaths(new Map(readings));
    });
  }, [nodes, edges]);

  const handleAddSign = () => {
    if (!newSignNodeId) return;
    const node = nodes.find(n => n.id === newSignNodeId);
    if (!node) return;
    addSign({
      id: `sign_${Math.floor(Math.random() * 10000)}`,
      label: `${node.label} (${node.id})`,
      nodeId: node.id,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 150) + 100}`,
      status: 'ONLINE'
    });
    setNewSignNodeId('');
  };

  const availableNodes = nodes.filter(n => !n.isExit && !signs.find(s => s.nodeId === n.id));

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10 pt-4 md:pt-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">Smart Signage Matrix</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Hardware management portal. Add or remove physical smart signs and monitor their network status.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] text-xs font-bold text-[var(--color-muted)]">
          <Shield size={14} /> ADMIN ACCESS ACTIVE
        </div>
      </div>

      {isAdmin && (
        <div className="fade-up flex items-center gap-3 p-4 bg-[var(--color-panel-2)] border border-[var(--color-border)] rounded-xl" style={{ animationDelay: '0.05s' }}>
          <select 
            className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
            value={newSignNodeId}
            onChange={(e) => setNewSignNodeId(e.target.value)}
          >
            <option value="">-- Select Node to Add Sign --</option>
            {availableNodes.map(n => (
              <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
            ))}
          </select>
          <button onClick={handleAddSign} disabled={!newSignNodeId} className="btn-primary">
            <Plus size={16} /> Add Hardware
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {signs.map((sign, i) => {
          return (
            <div key={sign.id} className="card-md p-6 fade-up flex flex-col items-center justify-center min-h-[250px] relative group" style={{ animationDelay: `${(i % 10) * 0.05}s` }}>
              {isAdmin && (
                <button 
                  onClick={() => removeSign(sign.id)} 
                  className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded"
                >
                  <Trash size={16} />
                </button>
              )}
              <div className="w-full flex items-start justify-between mb-8 pr-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Monitor size={12} /> {sign.id}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-fg)]">{sign.label}</span>
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px] font-mono">
                   <span className="text-[var(--color-muted)] flex items-center gap-1"><Wifi size={10} /> {sign.ipAddress}</span>
                   {sign.status === 'ONLINE' ? (
                     <span className="text-emerald-500 flex items-center gap-1"><Activity size={10} /> LIVE</span>
                   ) : (
                     <span className="text-red-500 flex items-center gap-1"><XCircle size={10} /> OFFLINE</span>
                   )}
                </div>
              </div>
              
              <SmartSignMatrix path={paths.get(sign.nodeId)} systemMode={systemMode} />
            </div>
          );
        })}
        {signs.length === 0 && (
          <div className="col-span-full p-12 text-center text-[var(--color-muted)] border border-dashed border-[var(--color-border)] rounded-xl">
            No hardware configured. Connect a smart sign to the network.
          </div>
        )}
      </div>
    </div>
  );
}
