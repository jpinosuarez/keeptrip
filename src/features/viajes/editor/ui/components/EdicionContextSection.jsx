import React from 'react';
import InfoTooltip from '@shared/ui/components/InfoTooltip';
import { X } from 'lucide-react';
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
      <label className="text-[0.78rem] font-extrabold text-textSecondary uppercase tracking-[0.5px] flex items-center gap-1.5">
        {t('labels.contexto')}
      </label>

      <div className="flex gap-4 items-end flex-wrap mb-4">
        <div className="min-w-[160px]">
          <label className="text-xs text-textSecondary mb-1.5 block">
            {t('labels.presupuesto')} <InfoTooltip textKey="editor:tooltip.presupuesto" size={13} />
          </label>
          <select
            value={formData.presupuesto || ''}
            onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value || null })}
            className="w-full border border-border rounded-sm px-3.5 py-2.5 text-base text-charcoalBlue outline-none bg-background transition-all focus:border-atomicTangerine"
          >
            <option value="">-- {t('labels.selectDefault')} --</option>
            <option value="Mochilero">{t('budget.mochilero')}</option>
            <option value="Económico">{t('budget.economico')}</option>
            <option value="Confort">{t('budget.confort')}</option>
            <option value="Lujo">{t('budget.lujo')}</option>
          </select>
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
            {(formData.companions || []).map((c, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1.5 rounded-md bg-background border border-border flex gap-1.5 items-center max-w-[200px]"
              >
                <span className="text-[0.875rem] overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{c.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      companions: prev.companions.filter((_, i) => i !== idx),
                    }))
                  }
                  aria-label={t('labels.removeCompanion', { name: c.name })}
                  className="bg-transparent border-none text-textSecondary cursor-pointer flex items-center p-0.5 shrink-0 hover:text-danger transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EdicionContextSection;
