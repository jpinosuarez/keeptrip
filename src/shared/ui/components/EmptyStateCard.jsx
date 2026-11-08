import React from 'react';
import { cn } from '@shared/lib/utils/cn';

/**
 * EmptyStateCard — the single canonical empty-state card for Keeptrip.
 *
 * Implements the Sistema Visual Base v2.0:
 *  - Surfaces: white card on Slate-50, soft border + official soft shadow.
 *  - Accents: Atomic Tangerine (#FF6B35) / Muted Teal (#45B0A8) / Charcoal Blue (#2C3E50).
 *  - Geometry: 8px spacing scale, rounded-[28px] mobile → rounded-[32px] desktop.
 *  - Ergonomics: primary CTA min-w-[240px] + min-h-[44px] (touch target).
 *  - Layout: `w-full max-w-2xl mx-auto min-w-0` so the card expands cleanly inside
 *    its parent and stays centered — never collapsing into a narrow vertical
 *    column. (`self-stretch` is intentionally NOT used: in flex-row parents it
 *    stretched the card vertically and squashed the content into a narrow column.)
 *
 * Props:
 *  - icon: LucideIcon (optional)
 *  - accentColor?: 'orange' | 'teal' | 'charcoal' (default 'orange')
 *  - badgeText?: string (optional pill above the title)
 *  - title: string
 *  - description: string
 *  - primaryAction?: { label: string, onClick: () => void, icon?: LucideIcon }
 *  - secondaryAction?: { label: string, onClick: () => void }
 *  - className?: string (layout/accent override, e.g. transparent Bento variant)
 *  - ...rest (forwarded to the root — keeps existing data-testid attributes)
 */
const ACCENTS = {
  orange: {
    text: 'text-[#FF6B35]',
    badgeBg: 'bg-[#FF6B35]/10',
    iconBg: 'bg-[#FF6B35]/10',
    cta: 'bg-[#FF6B35] hover:bg-[#e85d2a] shadow-[0_4px_20px_rgba(255,107,53,0.3)]',
  },
  teal: {
    text: 'text-[#45B0A8]',
    badgeBg: 'bg-[#45B0A8]/10',
    iconBg: 'bg-[#45B0A8]/10',
    cta: 'bg-[#45B0A8] hover:bg-[#3aa199] shadow-[0_4px_20px_rgba(69,176,168,0.3)]',
  },
  charcoal: {
    text: 'text-[#2C3E50]',
    badgeBg: 'bg-[#2C3E50]/10',
    iconBg: 'bg-[#2C3E50]/10',
    cta: 'bg-[#2C3E50] hover:bg-[#243342] shadow-[0_4px_20px_rgba(44,62,80,0.3)]',
  },
};

const EmptyStateCard = ({
  icon: Icon = null,
  accentColor = 'orange',
  badgeText = null,
  title,
  description,
  primaryAction = null,
  secondaryAction = null,
  className = '',
  ...rest
}) => {
  const accent = ACCENTS[accentColor] || ACCENTS.orange;
  const PrimaryIcon = primaryAction?.icon || null;

  return (
    <div
      className={cn(
        'w-full max-w-2xl mx-auto min-w-0 bg-white rounded-[28px] md:rounded-[32px] border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 md:p-12 text-center flex flex-col items-center justify-center',
        className
      )}
      {...rest}
    >
      {Icon && (
        <div
          className={cn(
            'mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full',
            accent.iconBg,
            accent.text
          )}
        >
          <Icon size={30} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}

      {badgeText && (
        <span
          className={cn(
            'mb-4 inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide font-sans',
            accent.badgeBg,
            accent.text
          )}
        >
          {badgeText}
        </span>
      )}

      <h2 className="m-0 font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 leading-snug">
        {title}
      </h2>

      {description && (
        <p className="mt-3 mb-0 max-w-md font-sans text-sm sm:text-base text-slate-500 leading-relaxed break-normal whitespace-normal">
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-8 flex w-full flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={cn(
                'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[240px] rounded-full px-6 text-sm font-bold text-white transition-all cursor-pointer active:scale-[0.98]',
                accent.cta
              )}
            >
              {PrimaryIcon && <PrimaryIcon size={18} />}
              <span>{primaryAction.label}</span>
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer active:scale-[0.98]"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyStateCard;
