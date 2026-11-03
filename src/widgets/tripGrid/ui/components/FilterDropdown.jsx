import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import CountryFlag from '@shared/ui/components/CountryFlag';
import { cn } from '@shared/lib/utils/cn';

/**
 * FilterDropdown — lightweight Keeptrip Visual System v2.0 custom dropdown.
 * Replaces native <select> so options can render <CountryFlag />, counts and
 * the brand's rounded geometry.
 */
const FilterDropdown = ({
  triggerLabel,
  triggerIcon = null,
  active = false,
  options = [],
  value,
  onSelect,
  ariaLabel,
  align = 'left',
  minWidth = 200,
  testId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [flipRight, setFlipRight] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    // Flip the popover to the right edge when opening near the viewport border,
    // preventing horizontal overflow on narrow desktop widths.
    const clampHorizontal = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setFlipRight(rect.left + minWidth > window.innerWidth - 16);
    };

    clampHorizontal();
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', clampHorizontal);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', clampHorizontal);
    };
  }, [isOpen, minWidth]);

  const current = options.find((option) => option.value === value);

  return (
    <div className="relative" ref={rootRef} data-testid={testId}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || triggerLabel}
        className={cn(
          'h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-2',
          'transition-colors border shadow-2xs max-w-full',
          active
            ? 'bg-[#FF6B35]/10 border-[#FF6B35] text-[#FF6B35]'
            : 'bg-white border-slate-200 text-slate-700 hover:border-[#FF6B35]/60 hover:text-slate-900'
        )}
      >
        {triggerIcon}
        {current?.flagCode && <CountryFlag code={current.flagCode} size="xs" />}
        <span className="truncate max-w-[150px]">{triggerLabel}</span>
        <ChevronDown
          size={14}
          className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{ minWidth }}
          className={cn(
            'absolute top-full mt-1.5 z-50 min-w-[200px] max-w-[calc(100vw-32px)] sm:max-w-xs',
            'max-h-[260px] overflow-y-auto overscroll-contain',
            'bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 flex flex-col gap-0.5',
            align === 'right' || flipRight ? 'right-0' : 'left-0'
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect?.(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium text-left',
                  'flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors',
                  isSelected && 'bg-[#FF6B35]/5 text-[#FF6B35]'
                )}
              >
                <span className="flex items-center min-w-0 flex-1">
                  {option.flagCode && <CountryFlag code={option.flagCode} size="xs" />}
                  <span className={cn('truncate', option.flagCode && 'ml-2')}>{option.label}</span>
                </span>
                {option.count != null && (
                  <span className="text-slate-400 text-[11px] font-mono shrink-0">
                    ({option.count})
                  </span>
                )}
                {isSelected && <Check size={14} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
