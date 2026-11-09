import React from 'react';
import { cn } from '@shared/lib/utils/cn';

const ACCENTS = {
  orange: { iconBg: 'bg-[#FF6B35]/10', iconText: 'text-[#FF6B35]' },
  teal: { iconBg: 'bg-[#45B0A8]/10', iconText: 'text-[#45B0A8]' },
  charcoal: { iconBg: 'bg-[#2C3E50]/10', iconText: 'text-[#2C3E50]' },
};

export default function EmptyStateCard({
  icon: Icon,
  accentColor = 'orange',
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  ...rest
}) {
  const accent = ACCENTS[accentColor] || ACCENTS.orange;
  const PrimaryIcon = primaryAction?.icon;

  return (
    <div
      className={cn(
        'w-full max-w-[480px] mx-auto bg-white rounded-[28px] md:rounded-[32px] border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 md:p-10 text-center flex flex-col items-center justify-center box-border',
        className
      )}
      {...rest}
    >
      {Icon && (
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shrink-0', accent.iconBg, accent.iconText)}>
          <Icon aria-hidden="true" size={28} strokeWidth={1.75} />
        </div>
      )}

      <h3 className="w-full font-heading font-extrabold text-slate-800 text-lg md:text-xl tracking-tight text-center leading-snug">
        {title}
      </h3>

      {description && (
        <p
          style={{ width: '100%', maxWidth: '100%', whiteSpace: 'normal', wordBreak: 'normal' }}
          className="mt-3 w-full font-sans text-slate-500 text-sm md:text-base leading-relaxed text-center"
        >
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 w-full flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="min-h-[44px] min-w-[220px] rounded-full font-bold px-6 py-2.5 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 bg-[#FF6B35] hover:bg-[#e85a26]"
            >
              {PrimaryIcon && <PrimaryIcon size={16} />}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="min-h-[44px] min-w-[160px] rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
