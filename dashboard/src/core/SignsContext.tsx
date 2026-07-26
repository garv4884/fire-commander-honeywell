'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SmartSign } from './types';

interface SignsContextValue {
  signs: SmartSign[];
  addSign: (sign: SmartSign) => void;
  removeSign: (id: string) => void;
  updateSignStatus: (id: string, status: 'ONLINE' | 'OFFLINE') => void;
}

const SignsContext = createContext<SignsContextValue | null>(null);

const DEFAULT_SIGNS: SmartSign[] = [
  { id: 'sign_1', label: 'Main Lobby (F1)', nodeId: 'F1_B1', ipAddress: '192.168.1.101', status: 'ONLINE' },
  { id: 'sign_2', label: 'Central Hallway (F1)', nodeId: 'F1_H2', ipAddress: '192.168.1.102', status: 'ONLINE' },
  { id: 'sign_3', label: 'North Wing (F2)', nodeId: 'F2_H3', ipAddress: '192.168.1.103', status: 'ONLINE' },
  { id: 'sign_4', label: 'Stairwell W (F2)', nodeId: 'F2_STAIR_W', ipAddress: '192.168.1.104', status: 'ONLINE' },
];

export function SignsProvider({ children }: { children: React.ReactNode }) {
  const [signs, setSigns] = useState<SmartSign[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('fire_cmd_signs_v2');
    if (saved) {
      try {
        setSigns(JSON.parse(saved));
      } catch (e) {
        setSigns(DEFAULT_SIGNS);
      }
    } else {
      setSigns(DEFAULT_SIGNS);
    }
  }, []);

  const saveSigns = (newSigns: SmartSign[]) => {
    setSigns(newSigns);
    localStorage.setItem('fire_cmd_signs_v2', JSON.stringify(newSigns));
  };

  const addSign = (sign: SmartSign) => saveSigns([...signs, sign]);
  const removeSign = (id: string) => saveSigns(signs.filter(s => s.id !== id));
  const updateSignStatus = (id: string, status: 'ONLINE' | 'OFFLINE') => {
    saveSigns(signs.map(s => s.id === id ? { ...s, status } : s));
  };

  return (
    <SignsContext.Provider value={{ signs, addSign, removeSign, updateSignStatus }}>
      {children}
    </SignsContext.Provider>
  );
}

export function useSigns() {
  const context = useContext(SignsContext);
  if (!context) {
    throw new Error('useSigns must be used within a SignsProvider');
  }
  return context;
}
