import { ReactNode } from 'react';
import { StatusOS } from '../../types';

interface ChipProps {
  children: ReactNode;
  status?: StatusOS;
  className?: string;
}

const statusConfig = {
  aberta: {
    bg: 'bg-[#1E88E5]/20',
    text: 'text-[#1E88E5]',
    label: 'Aberta',
  },
  em_andamento: {
    bg: 'bg-[#FFC107]/20',
    text: 'text-[#FFC107]',
    label: 'Em andamento',
  },
  aguardando_peca: {
    bg: 'bg-[#F97316]/20',
    text: 'text-[#F97316]',
    label: 'Aguardando peça',
  },
  concluida: {
    bg: 'bg-[#22C55E]/20',
    text: 'text-[#22C55E]',
    label: 'Concluída',
  },
  entregue: {
    bg: 'bg-[#22C55E]/30',
    text: 'text-[#22C55E]',
    label: 'Entregue',
  },
};

export function Chip({ children, status, className = '' }: ChipProps) {
  if (status) {
    const config = statusConfig[status];
    return (
      <span
        className={`
          inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
          ${config.bg} ${config.text}
          ${className}
        `}
      >
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
        bg-[#1A1F26] text-gray-300
        ${className}
      `}
    >
      {children}
    </span>
  );
}
