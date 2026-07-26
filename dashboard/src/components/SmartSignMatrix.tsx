import React from 'react';
import { ArrowRight, ArrowDown, XCircle, ShieldCheck } from 'lucide-react';
import type { EvacuationPath } from '../core/types';

interface Props {
  path?: EvacuationPath | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  systemMode?: string;
}

export function SmartSignMatrix({ path, className = '', size = 'md', systemMode = 'EMERGENCY' }: Props) {
  const getDirectionInfo = () => {
    if (systemMode === 'NORMAL') return { text: 'SAFE', icon: ShieldCheck, color: 'text-emerald-500' };

    if (!path || path.nodeIds.length < 2) return { text: 'STAY PUT', icon: XCircle, color: 'text-red-500' };
    if (path.hazardLevel === 'BLOCKED') return { text: 'NO SAFE EXIT', icon: XCircle, color: 'text-red-500' };

    const nextNode = path.nodeIds[1];
    if (nextNode.includes('STAIR')) return { text: 'STAIRS', icon: ArrowDown, color: 'text-red-500' };
    if (nextNode.includes('EXIT')) return { text: 'EXIT', icon: ArrowRight, color: 'text-red-500' };
    
    return { text: 'PROCEED', icon: ArrowRight, color: 'text-red-500' };
  };

  const dir = getDirectionInfo();

  const sizeClasses = {
    sm: 'px-4 py-3 border-2 gap-2 max-w-[200px]',
    md: 'px-8 py-5 border-4 gap-3 max-w-[300px]',
    lg: 'px-12 py-8 border-4 gap-4 max-w-[350px]',
  };
  
  const iconSizes = { sm: 32, md: 48, lg: 64 };
  const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <div className={`flex flex-col items-center border-gray-900 rounded bg-[#111] w-full ${sizeClasses[size]} ${className}`}>
      <dir.icon size={iconSizes[size]} className={dir.color} strokeWidth={2.5} />
      <div className={`${textSizes[size]} font-black tracking-widest uppercase font-mono ${dir.color} text-center`}>
        {dir.text}
      </div>
    </div>
  );
}
