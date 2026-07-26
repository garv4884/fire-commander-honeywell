'use client';

import React, { useEffect, useState } from 'react';
import { Shield, FileText, Printer, Calendar, Clock, AlertTriangle, Activity, TrendingUp, Map } from 'lucide-react';
import type { EventLogEntry } from '../../core/types';

export default function ReportsPage() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [events, setEvents] = useState<EventLogEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('fire_cmd_events');
    if (saved) {
      try { setEvents(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const time  = new Date().toLocaleTimeString();

  const criticalEvents = events.filter(e => e.level === 'CRITICAL');
  const warningEvents  = events.filter(e => e.level === 'WARNING');
  const rerouteEvents  = events.filter(e => e.message.includes('rerouted'));
  const displayEvents  = events.slice().reverse().slice(0, 20);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10 pt-4 md:pt-2">
      
      {/* Non-printable header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 fade-up print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">Incident Reports</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Post-incident safety analytics. {events.length > 0 ? `${events.length} live events captured.` : 'No events logged yet. Run a simulation first.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] text-xs font-bold text-[var(--color-muted)]">
            <Shield size={14} /> ADMIN ACCESS ACTIVE
          </div>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="bg-[var(--color-panel)] text-[var(--color-fg)] rounded-xl border border-[var(--color-border)] shadow-sm p-8 md:p-12 fade-up print:m-0 print:p-0 print:shadow-none print:border-none print:bg-white print:text-black" style={{ animationDelay: '0.1s' }}>
        
        {/* Report Header */}
        <div className="flex justify-between items-start border-b-2 border-[var(--color-border)] pb-6 mb-8 print:border-gray-200">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={32} />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight m-0 leading-tight">Fire Commander</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Post-Incident Analytics Report</span>
            </div>
          </div>
          <div className="text-right text-xs text-[var(--color-muted)] font-mono print:text-gray-500">
            <div className="flex items-center justify-end gap-2 mb-1"><Calendar size={12}/> {today}</div>
            <div className="flex items-center justify-end gap-2"><Clock size={12}/> {time}</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 print:text-gray-400">Executive Summary</h2>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed print:text-gray-700">
            This document outlines the automated system response captured during incident simulation.
            The Dynamic Evacuation Router continuously processed multi-sensor data streams (Temperature, Smoke PPM, Flame IR, Occupancy)
            through the exponential sensor fusion formula <strong className="text-[var(--color-fg)] print:text-black">W = base × exp(α·T̃ + β·S̃ + γ·F) × (1 + δ·O)</strong> and 
            applied Dijkstra pathfinding to compute safe evacuation routes for all {' '}
            <strong className="text-[var(--color-fg)] print:text-black">26 building nodes</strong> across 2 floors in real-time.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-panel-2)] print:border-gray-200 print:bg-gray-50">
            <span className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1 print:text-gray-500">Total Events</span>
            <span className="text-xl font-black text-[var(--color-fg)] print:text-black">{events.length}</span>
          </div>
          <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-panel-2)] print:border-gray-200 print:bg-gray-50">
            <span className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1 print:text-gray-500">Critical Alerts</span>
            <span className="text-xl font-black text-red-500 print:text-red-600">{criticalEvents.length}</span>
          </div>
          <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-panel-2)] print:border-gray-200 print:bg-gray-50">
            <span className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1 print:text-gray-500">Paths Re-routed</span>
            <span className="text-xl font-black text-[var(--color-fg)] print:text-black">{rerouteEvents.length}</span>
          </div>
          <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-panel-2)] print:border-gray-200 print:bg-gray-50">
            <span className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1 print:text-gray-500">Warnings Logged</span>
            <span className="text-xl font-black text-amber-500 print:text-amber-600">{warningEvents.length}</span>
          </div>
        </div>

        {/* System Architecture */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 print:text-gray-400">System Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="border border-[var(--color-border)] rounded-lg p-3 print:border-gray-200">
              <div className="font-bold text-[var(--color-fg)] mb-1 print:text-black">Algorithm Layer</div>
              <div className="text-[var(--color-muted)] print:text-gray-600">Dijkstra (min-heap) with dynamic edge weights. Recomputes all paths within 1 tick (100ms) of any sensor state change.</div>
            </div>
            <div className="border border-[var(--color-border)] rounded-lg p-3 print:border-gray-200">
              <div className="font-bold text-[var(--color-fg)] mb-1 print:text-black">Sensor Fusion</div>
              <div className="text-[var(--color-muted)] print:text-gray-600">Exponential weighting: α=2.0 (Temp), β=3.0 (Smoke), γ=5.0 (Flame), δ=0.1 (Occupancy). Flame = immediate hard-block.</div>
            </div>
            <div className="border border-[var(--color-border)] rounded-lg p-3 print:border-gray-200">
              <div className="font-bold text-[var(--color-fg)] mb-1 print:text-black">Fail-Safe</div>
              <div className="text-[var(--color-muted)] print:text-gray-600">Blocked edges set to ∞ weight. Dijkstra automatically reroutes through next-best unblocked path. System never deadlocks.</div>
            </div>
          </div>
        </div>

        {/* Live Timeline Log */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4 print:text-gray-400">Live Event Timeline Log</h2>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden print:border-gray-200">
            {displayEvents.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-panel-2)] text-[var(--color-muted)] uppercase tracking-wider print:bg-gray-100 print:text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-bold border-b border-[var(--color-border)] print:border-gray-200">Time</th>
                    <th className="px-4 py-2 font-bold border-b border-[var(--color-border)] print:border-gray-200">Level</th>
                    <th className="px-4 py-2 font-bold border-b border-[var(--color-border)] print:border-gray-200">Event</th>
                    <th className="px-4 py-2 font-bold border-b border-[var(--color-border)] print:border-gray-200">Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-fg)] print:divide-gray-100 print:bg-white print:text-gray-800">
                  {displayEvents.map(e => (
                    <tr key={e.id}>
                      <td className="px-4 py-2 font-mono text-[var(--color-muted)]">{new Date(e.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          e.level === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                          e.level === 'WARNING'  ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>{e.level}</span>
                      </td>
                      <td className="px-4 py-2 font-semibold">{e.message}</td>
                      <td className="px-4 py-2 text-[var(--color-muted)]">{e.zoneLabel ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-[var(--color-muted)] text-sm">
                No events logged yet. Run a simulation scenario from the Simulator tab to generate live incident data.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
