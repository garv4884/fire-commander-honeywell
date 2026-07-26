'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Node, Edge } from './types';
import { BUILDING_NODES, BUILDING_EDGES } from '../lib/building-config';
import { fireSimulator } from '../lib/fire-simulator';

interface MapContextType {
  nodes: Node[];
  edges: Edge[];
  saveGraph: (newNodes: Node[], newEdges: Edge[]) => void;
  resetGraph: () => void;
}

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<Node[]>(BUILDING_NODES);
  const [edges, setEdges] = useState<Edge[]>(BUILDING_EDGES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fire_cmd_graph');
      if (saved) {
        const parsed = JSON.parse(saved);
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        fireSimulator.loadGraph(parsed.nodes);
      } else {
        fireSimulator.loadGraph(BUILDING_NODES);
      }
    } catch (e) {
      console.error(e);
      fireSimulator.loadGraph(BUILDING_NODES);
    }
    setIsLoaded(true);
  }, []);

  const saveGraph = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    localStorage.setItem('fire_cmd_graph', JSON.stringify({ nodes: newNodes, edges: newEdges }));
    fireSimulator.loadGraph(newNodes);
  }, []);

  const resetGraph = useCallback(() => {
    setNodes(BUILDING_NODES);
    setEdges(BUILDING_EDGES);
    localStorage.removeItem('fire_cmd_graph');
    fireSimulator.loadGraph(BUILDING_NODES);
  }, []);

  // Removed isLoaded check to allow SSR rendering

  return (
    <MapContext.Provider value={{ nodes, edges, saveGraph, resetGraph }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapStore() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapStore must be used within MapProvider');
  return ctx;
}
