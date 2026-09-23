import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 animate-pulse space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-800 rounded w-24" />
        <div className="h-6 bg-slate-800 rounded-full w-20" />
      </div>
      <div className="h-5 bg-slate-800 rounded w-3/4" />
      <div className="h-4 bg-slate-800/60 rounded w-1/2" />
      <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center">
        <div className="h-3 bg-slate-800/60 rounded w-1/3" />
        <div className="h-8 bg-slate-800 rounded-lg w-28" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-800/80 flex gap-4">
        <div className="h-10 bg-slate-800 rounded-xl flex-1" />
        <div className="h-10 bg-slate-800 rounded-xl w-32" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div className="space-y-2 w-1/3">
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800/50 rounded w-2/3" />
            </div>
            <div className="h-4 bg-slate-800 rounded w-1/4" />
            <div className="h-6 bg-slate-800 rounded-full w-24" />
            <div className="h-8 bg-slate-800 rounded-lg w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};
