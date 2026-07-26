'use client';

import React, { useState } from 'react';
import { Server, Activity, Wifi, Shield, RefreshCw } from 'lucide-react';

const NODES = [
  { id: 'node_1', name: 'N1 Server', ip: '192.168.1.101', status: 'offline', lastPing: '-' },
  { id: 'node_2', name: 'N2 Hall-1', ip: '192.168.1.102', status: 'offline', lastPing: '-' },
  { id: 'node_3', name: 'N3 Hall-2', ip: '192.168.1.103', status: 'offline', lastPing: '-' },
];

export default function HardwarePage() {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">Hardware Nodes</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Manage localized ESP32 sensor mesh network connections and MQTT broker settings.
          </p>
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="btn-primary"
        >
          <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
          {isScanning ? 'Scanning...' : 'Scan Network'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="md:col-span-2 card-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Server size={18} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-fg)]">ESP32 Mesh Status</h2>
          </div>
          
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-panel-2)] text-[var(--color-muted)] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Node Name</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last Ping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-panel)]">
                {NODES.map((node) => (
                  <tr key={node.id} className="hover:bg-[var(--color-panel-2)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--color-fg)] flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      {node.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-muted)]">{node.ip}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)]">
                        Offline
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[var(--color-muted)]">{node.lastPing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-[11px] text-[var(--color-muted)] flex items-start gap-2 bg-[var(--color-panel-2)] p-3 rounded-lg border border-[var(--color-border)]">
            <Activity size={14} className="shrink-0 mt-0.5" />
            <p>
              The system is currently running in <strong>Simulation Mode</strong>. Real-time data from ESP32 nodes is suspended. To connect physical hardware, ensure the broker is running on port 1883.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wifi size={16} className="text-[var(--color-muted)]" />
              <h3 className="text-sm font-bold text-[var(--color-fg)]">MQTT Broker</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Host address</label>
                <input type="text" readOnly value="tcp://0.0.0.0" className="w-full bg-[var(--color-panel-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-fg)] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Port</label>
                <input type="text" readOnly value="1883" className="w-full bg-[var(--color-panel-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-fg)] outline-none" />
              </div>
            </div>
          </div>

          <div className="card-md p-6 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-[var(--color-fg)]">Security</h3>
            </div>
            <p className="text-[11px] text-[var(--color-muted)]">
              TLS encryption is disabled for localized testing. Do not expose this module directly to the public internet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
