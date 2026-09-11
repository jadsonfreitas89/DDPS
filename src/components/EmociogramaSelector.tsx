import React from 'react';
import { Emociograma } from '../types';

interface EmociogramaSelectorProps {
  value?: Emociograma;
  onChange: (value: Emociograma) => void;
  disabled?: boolean;
}

export const EmociogramaSelector: React.FC<EmociogramaSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const options: { id: Emociograma; emoji: string; label: string; desc: string; activeClass: string; inactiveClass: string }[] = [
    {
      id: 'BOM',
      emoji: '🙂',
      label: 'BOM',
      desc: 'Disposto e atento',
      activeClass: 'bg-green-50 text-green-950 border-2 border-green-600 ring-2 ring-green-500/20 shadow-xs font-extrabold',
      inactiveClass: 'bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:bg-green-50/30'
    },
    {
      id: 'REGULAR',
      emoji: '😐',
      label: 'REGULAR',
      desc: 'Atenção redobrada',
      activeClass: 'bg-yellow-50 text-yellow-950 border-2 border-yellow-500 ring-2 ring-yellow-400/20 shadow-xs font-extrabold',
      inactiveClass: 'bg-white text-gray-700 border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30'
    },
    {
      id: 'RUIM',
      emoji: '🙁',
      label: 'RUIM',
      desc: 'Necessita apoio',
      activeClass: 'bg-red-50 text-red-950 border-2 border-red-600 ring-2 ring-red-500/20 shadow-xs font-extrabold',
      inactiveClass: 'bg-white text-gray-700 border border-gray-200 hover:border-red-300 hover:bg-red-50/30'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
        Como estou me sentindo hoje?
      </span>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl min-h-[96px] transition-all cursor-pointer active:scale-95 text-center
                ${isSelected ? opt.activeClass : opt.inactiveClass}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-3xl sm:text-4xl mb-1 transition-transform duration-200 select-none">
                {opt.emoji}
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                {opt.label}
              </span>
              <span className="text-[11px] opacity-75 mt-0.5 hidden sm:inline font-medium">
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
