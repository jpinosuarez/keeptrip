import { cn } from '@shared/lib/utils/cn';
import React from 'react';

const areOnlyImageChildren = (children) => {
  const childList = React.Children.toArray(children).filter(Boolean);
  if (childList.length === 0) return false;
  return childList.every((child) => React.isValidElement(child) && child.type === 'img');
};

/**
 * Tarjeta tipo Bento local para el Modo Destino del VisorViaje.
 * Puro presentacional — usa Tailwind classes.
 * NO importa ni extiende BentoCard.
 *
 * @param {{ icon?: string, label: string, value?: string, children?: React.ReactNode, className?: string }} props
 */
const ContextCard = ({ icon, label, value, children, className }) => (
  <div className={cn(
    "backdrop-blur-md bg-white/70 border border-border rounded-lg p-4 shadow-sm flex flex-col gap-2 transition-all overflow-hidden",
    className
  )}>
    <div className="flex items-center gap-2">
      {icon && <span className="text-[1.2rem] leading-none">{icon}</span>}
      <span className="text-[0.75rem] font-bold uppercase tracking-wider text-mutedTeal">{label}</span>
    </div>
    {children ? (
      <div className={cn(
        "mt-1 rounded-md overflow-hidden",
        areOnlyImageChildren(children) && "flex flex-wrap items-center gap-1.5"
      )}>{children}</div>
    ) : (
      value && <span className="text-[0.95rem] font-semibold text-textPrimary leading-[1.4]">{value}</span>
    )}
  </div>
);

export default ContextCard;
