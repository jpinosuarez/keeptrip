import React from 'react';
import InfoTooltip from '@shared/ui/components/InfoTooltip';
import { X, Users, Wallet, Heart, User, Sparkles } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

const VIBES = ['Gastronómico', 'Aventura', 'Relax', 'Roadtrip', 'Cultural'];
const VIBE_KEY_MAP = {
  'Gastronómico': 'gastronomico',
  Aventura: 'aventura',
  Relax: 'relax',
  Roadtrip: 'roadtrip',
  Cultural: 'cultural',
};

const EdicionContextSection = ({
  t,
  formData,
  setFormData,
  showCompanions = true,
  companionDraft,
  companionResults,
  onCompanionSearch,
  onAddCompanionFreeform,
  onAddCompanionFromResult,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-background p-4 rounded-lg border border-border">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        <Users size={15} className="text-[#FF6B35]" /> {t('labels.contexto', 'Contexto del viaje')}
      </h3>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <Wallet size={15} className="text-[#FF6B35]" /> {t('labels.presupuesto', 'Presupuesto')}
          <InfoTooltip textKey="editor:tooltip.presupuesto" size={13} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            ['Mochilero', 'budget.mochilero', 'Mochilero'],
            ['Económico', 'budget.economico', 'Económico'],
            ['Confort', 'budget.confort', 'Confort'],
            ['Lujo', 'budget.lujo', 'Lujo'],
          ].map(([value, key, fallback]) => {
            const selected = (formData.presupuesto || '') === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, presupuesto: prev.presupuesto === value ? '' : value }))
                }
                aria-pressed={selected}
                className={cn(
                  'min-h-[44px] px-3 py-1.5 rounded-full border text-[0.875rem] transition-all duration-200 cursor-pointer',
                  selected
                    ? 'border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine font-bold'
                    : 'border-border bg-surface text-textPrimary font-normal'
                )}
              >
                {t(key, fallback)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <Heart size={15} className="text-[#FF6B35]" /> {t('labels.companionType', 'Tipo de compañía')}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            ['solo', User, 'Solo'],
            ['couple', Heart, 'Pareja'],
            ['family', Users, 'Familia'],
            ['friends', Users, 'Amigos'],
          ].map(([value, Icon, fallback]) => {
            const selected = (formData.companionType || '') === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    companionType: prev.companionType === value ? null : value,
                  }))
                }
                aria-pressed={selected}
                className={cn(
                  'min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[0.875rem] transition-all duration-200 cursor-pointer',
                  selected
                    ? 'border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine font-bold'
                    : 'border-border bg-surface text-textPrimary font-normal'
                )}
              >
                <Icon size={14} />
                {t(`companionType.${value}`, fallback)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-textSecondary block">
          {t('labels.vibe')} <InfoTooltip textKey="editor:tooltip.vibe" size={13} />
        </label>
        <div className="flex gap-2 flex-wrap mt-1.5">
          {VIBES.map((v) => {
            const selected = (formData.vibe || []).includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    vibe: (prev.vibe || []).includes(v) ? (prev.vibe || []).filter((x) => x !== v) : [...(prev.vibe || []), v],
                  }))
                }
                className={cn(
                  "px-2.5 py-1.5 rounded-md border text-[0.875rem] transition-all duration-200 cursor-pointer",
                  selected 
                    ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine font-bold" 
                    : "border-border bg-surface text-textPrimary font-normal"
                )}
              >
                {t(`vibes.${VIBE_KEY_MAP[v]}`)}
              </button>
            );
          })}
        </div>
      </div>

      {showCompanions && (
        <div className="mt-3">
          <label className="text-xs text-textSecondary">{t('labels.companions')}</label>
          <div className="flex gap-2 items-center mt-2">
            <input
              placeholder={t('labels.nameOrEmail')}
              value={companionDraft || ''}
              onChange={(e) => onCompanionSearch(e.target.value)}
              maxLength={100}
              className="flex-1 min-w-0 px-2.5 py-2 rounded-sm border border-border text-[0.875rem] outline-none box-border bg-background"
            />
            <button
              type="button"
              onClick={() => companionDraft && companionDraft.trim() && onAddCompanionFreeform(companionDraft)}
              disabled={!companionDraft?.trim()}
              className="bg-surface border border-border rounded-sm px-3.5 py-2 text-[0.875rem] font-bold text-textPrimary cursor-pointer transition-all hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('labels.addCompanion')}
            </button>
          </div>

          {companionResults.length > 0 && (
            <div className="border border-border rounded-sm mt-2 max-h-[160px] overflow-y-auto bg-surface">
              {companionResults.map((u) => (
                <div
                  key={u.uid}
                  className="p-2 px-3 flex justify-between items-center cursor-pointer gap-2 hover:bg-background transition-colors"
                  onClick={() => onAddCompanionFromResult(u)}
                >
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[0.875rem]">{u.displayName || u.email}</strong>
                    <div className="text-xs text-textSecondary overflow-hidden text-ellipsis whitespace-nowrap">{u.email}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddCompanionFromResult(u);
                    }}
                    className="bg-surface border border-border rounded-sm px-2.5 py-1.5 text-[0.75rem] font-bold text-textPrimary cursor-pointer transition-all hover:bg-background"
                  >
                    {t('labels.addCompanion')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {companionResults.length === 0 && companionDraft && companionDraft.includes('@') && (
            <div className="mt-2">
              <button
                type="button"
                className="bg-surface border border-border rounded-sm px-2.5 py-1.5 text-[0.75rem] font-bold text-textPrimary cursor-pointer transition-all hover:bg-background"
                onClick={() => onAddCompanionFreeform(companionDraft)}
              >
                {t('labels.inviteByEmail', { email: companionDraft })}
              </button>
            </div>
          )}

          <div className="flex gap-2 mt-2 flex-wrap">
            {(formData.companions || []).map((c, idx) => {
              const companionName = typeof c === 'string' ? c : (c?.name || c?.email || '');
              return (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 rounded-md bg-background border border-border flex gap-1.5 items-center max-w-[200px]"
                >
                  <span className="text-[0.875rem] overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{companionName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        companions: prev.companions.filter((_, i) => i !== idx),
                      }))
                    }
                    aria-label={t('labels.removeCompanion', { name: companionName })}
                    className="bg-transparent border-none text-textSecondary cursor-pointer flex items-center p-0.5 shrink-0 hover:text-danger transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EdicionContextSection;
