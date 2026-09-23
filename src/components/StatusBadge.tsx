import React from 'react';
import { Badge } from '@/components/ui/badge';
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
        <Badge variant="outline" className={`gap-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Aberta (Criada)</span>
        </Badge>
      );
    case 'EM_ASSISTENCIA':
      return (
        <Badge variant="outline" className={`gap-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium ${sizeClasses}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>Em Assistência</span>
        </Badge>
      );
    case 'RETORNADA':
      return (
        <Badge variant="outline" className={`gap-1.5 bg-purple-500/10 text-purple-300 border-purple-500/20 font-medium ${sizeClasses}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
          </span>
          <span>Aguardando Aceite</span>
        </Badge>
      );
    case 'CONCLUIDA':
      return (
        <Badge variant="outline" className={`gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Concluída</span>
        </Badge>
      );
    case 'CANCELADA':
      return (
        <Badge variant="outline" className={`gap-1.5 bg-red-500/10 text-red-400 border-red-500/20 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span>Cancelada</span>
        </Badge>
      );
  }
};
