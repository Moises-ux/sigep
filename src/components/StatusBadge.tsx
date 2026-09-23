import React from 'react';
import type { OSStatus } from '../types';

interface StatusBadgeProps {
  status: OSStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  switch (status) {
    case 'CRIADA':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Aberta (Criada)</span>
        </span>
      );
    case 'EM_ASSISTENCIA':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>Em Assistência</span>
        </span>
      );
    case 'RETORNADA':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 ${sizeClasses}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
          </span>
          <span>Aguardando Aceite</span>
        </span>
      );
    case 'CONCLUIDA':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Concluída</span>
        </span>
      );
    case 'CANCELADA':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span>Cancelada</span>
        </span>
      );
  }
};
