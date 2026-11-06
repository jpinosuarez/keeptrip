import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

const DEFAULT_EMOJIS = ['📍', '🏛️', '🍽️', '☕', '🌅', '🎭', '🏨', '🏖️', '🥾', '💎', '📸', '🎉', '🛍️', '🍺', '✨', '🎒', '🚗', '✈️', '🚆', '🚲'];

/**
 * EmojiInput — text input with an "input prefix" emoji popover + Add button.
 * The trigger is a 44px button showing the current prefix emoji; tapping opens a
 * compact floating 5-column emoji grid. Domain-agnostic reusable UI atom.
 */
const EmojiInput = ({
  value = '',
  onChange,
  emoji = '✨',
  onEmojiChange,
  onSubmit,
  placeholder = '',
  disabled = false,
  maxLength = 40,
  submitLabel = null,
  accent = 'tangerine',
  emojis = DEFAULT_EMOJIS,
}) => {
  const [open, setOpen] = useState(false);
  const submitBg = accent === 'teal' ? 'bg-mutedTeal' : 'bg-[#FF6B35]';

  return (
    <div className="relative flex items-center gap-1.5">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-0.5 text-lg transition-colors cursor-pointer"
          title="Cambiar emoji"
          aria-label="Cambiar emoji"
          aria-expanded={open}
        >
          <span aria-hidden="true">{emoji}</span>
          <ChevronDown size={11} className="text-slate-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 mt-1.5 z-50 p-2 bg-white rounded-2xl shadow-xl border border-slate-200 grid grid-cols-5 gap-1 w-[220px] max-h-[160px] overflow-y-auto">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onEmojiChange?.(e);
                    setOpen(false);
                  }}
                  className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg cursor-pointer"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-11 px-3.5 rounded-xl border border-slate-200 text-[0.82rem] text-charcoalBlue bg-background outline-none focus:border-[#FF6B35] disabled:opacity-60"
      />

      <button
        type="button"
        onClick={() => onSubmit?.()}
        disabled={disabled}
        className={cn(
          'h-11 px-3.5 rounded-xl text-white font-bold cursor-pointer flex items-center justify-center gap-1 shrink-0 transition-colors',
          submitBg,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {submitLabel ? <span className="text-[0.78rem]">{submitLabel}</span> : <Plus size={16} />}
      </button>
    </div>
  );
};

export default EmojiInput;
