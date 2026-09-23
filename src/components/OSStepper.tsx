import React from 'react';
import type { OrdemServico, OSStatus } from '../types';
import { FileText, ArrowRightLeft, PackageCheck, CheckCircle2, XCircle } from 'lucide-react';

interface OSStepperProps {
  os: OrdemServico;
}

const STEPS = [
  { key: 'CRIADA', label: 'Abertura', icon: FileText },
  { key: 'EM_ASSISTENCIA', label: 'Check-in (Envio)', icon: ArrowRightLeft },
  { key: 'RETORNADA', label: 'Check-out (Retorno)', icon: PackageCheck },
  { key: 'CONCLUIDA', label: 'Recebimento', icon: CheckCircle2 },
] as const;

export const OSStepper: React.FC<OSStepperProps> = ({ os }) => {
  if (os.status === 'CANCELADA') {
    return (
      <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-4 flex items-center gap-3 text-red-300">
        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <span className="font-semibold text-sm">Ordem de Serviço Cancelada</span>
          <p className="text-xs text-red-400/80 mt-0.5">O processo de manutenção foi interrompido.</p>
        </div>
      </div>
    );
  }

  const getStepIndex = (status: OSStatus): number => {
    switch (status) {
      case 'CRIADA':
        return 0;
      case 'EM_ASSISTENCIA':
        return 1;
      case 'RETORNADA':
        return 2;
      case 'CONCLUIDA':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(os.status);

  return (
    <div className="w-full py-2">
      <div className="relative grid grid-cols-4 items-start w-full">
        {/* Linha horizontal de fundo (vai exatamente do centro do 1º ícone ao 4º ícone) */}
        <div className="absolute top-4 sm:top-5 left-[12.5%] right-[12.5%] h-0.5 bg-slate-800 pointer-events-none" />

        {/* Linha horizontal de progresso ativo */}
        <div 
          className="absolute top-4 sm:top-5 left-[12.5%] h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500 pointer-events-none"
          style={{
            width: `${(currentStepIndex / 3) * 75}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.key} className="flex flex-col items-center text-center relative z-10 px-0.5 min-w-0">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-blue-600 border-2 border-blue-400 text-white shadow-lg shadow-blue-500/30 scale-105 sm:scale-110 ring-2 sm:ring-4 ring-blue-500/10'
                    : 'bg-slate-900 border-2 border-slate-800 text-slate-500'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <span
                className={`text-[10px] sm:text-xs font-medium mt-2 leading-tight transition-colors text-center break-words max-w-full ${
                  isCompleted
                    ? 'text-emerald-400'
                    : isCurrent
                    ? 'text-white font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>

              {isCompleted && step.key === 'CRIADA' && (
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-full">Criada</span>
              )}
              {isCompleted && step.key === 'EM_ASSISTENCIA' && os.checkin && (
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-full">Enviado</span>
              )}
              {isCompleted && step.key === 'RETORNADA' && os.checkout && (
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-full">Retornado</span>
              )}
              {isCompleted && step.key === 'CONCLUIDA' && os.aceite_funcionario && (
                <span className="text-[9px] sm:text-[10px] text-emerald-500/80 font-mono mt-0.5 truncate max-w-full">Concluído</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
