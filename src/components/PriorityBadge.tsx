import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { OSPrioridade } from '../types';

interface PriorityBadgeProps {
  prioridade?: OSPrioridade;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ prioridade = 'baixa', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  switch (prioridade) {
    case 'baixa':
      return (
        <Badge variant="outline" className={`gap-1.5 bg-slate-500/10 text-slate-400 border-slate-500/20 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Baixa</span>
        </Badge>
      );
    case 'media':
      return (
        <Badge variant="outline" className={`gap-1.5 bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span>Média</span>
        </Badge>
      );
    case 'alta':
      return (
        <Badge variant="outline" className={`gap-1.5 bg-orange-500/10 text-orange-400 border-orange-500/20 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span>Alta</span>
        </Badge>
      );
    case 'critica':
      return (
        <Badge variant="outline" className={`gap-1.5 bg-red-500/10 text-red-400 border-red-500/20 font-semibold ${sizeClasses}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span>Crítica</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`gap-1.5 bg-slate-500/10 text-slate-400 border-slate-500/20 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Baixa</span>
        </Badge>
      );
  }
};
