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
      <div className="relative flex items-center justify-between">
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-800 -z-0" />

        <div 
          className="absolute top-5 left-8 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500 -z-0"
          style={{
            width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
            right: `${100 - (currentStepIndex / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 group">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-blue-600 border-2 border-blue-400 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-500/10'
                    : 'bg-slate-900 border-2 border-slate-800 text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <span
                className={`text-xs font-medium mt-2 transition-colors ${
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
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">Criada</span>
              )}
              {isCompleted && step.key === 'EM_ASSISTENCIA' && os.checkin && (
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">Enviado</span>
              )}
              {isCompleted && step.key === 'RETORNADA' && os.checkout && (
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">Retornado</span>
              )}
              {isCompleted && step.key === 'CONCLUIDA' && os.aceite_funcionario && (
                <span className="text-[10px] text-emerald-500/80 font-mono mt-0.5">Concluído</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
