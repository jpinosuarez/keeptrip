import React from 'react';
import InfoTooltip from '@shared/ui/components/InfoTooltip';
import { COLORS, RADIUS, TRANSITIONS, FONTS } from '@shared/config';
import { X } from 'lucide-react';

const VIBES = ['Gastronómico', 'Aventura', 'Relax', 'Roadtrip', 'Cultural'];
const VIBE_KEY_MAP = {
  'Gastronómico': 'gastronomico',
  Aventura: 'aventura',
  Relax: 'relax',
  Roadtrip: 'roadtrip',
  Cultural: 'cultural',
};

const EdicionContextSection = ({
  styles,
  t,
  formData,
  setFormData,
  companionDraft,
  companionResults,
  onCompanionSearch,
  onAddCompanionFreeform,
  onAddCompanionFromResult,
}) => {
  return (
    <div style={styles.section}>
      <label style={styles.label}>{t('labels.contexto')}</label>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>
            {t('labels.presupuesto')} <InfoTooltip textKey="editor:tooltip.presupuesto" size={13} />
          </label>
          <select
            value={formData.presupuesto || ''}
            onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value || null })}
            style={styles.dateInput}
          >
            <option value="">-- {t('labels.selectDefault')} --</option>
            <option value="Mochilero">{t('budget.mochilero')}</option>
            <option value="Económico">{t('budget.economico')}</option>
            <option value="Confort">{t('budget.confort')}</option>
            <option value="Lujo">{t('budget.lujo')}</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>
            {t('labels.vibe')} <InfoTooltip textKey="editor:tooltip.vibe" size={13} />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
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
                  style={{
                    padding: '6px 10px',
                    borderRadius: RADIUS.md,
                    border: selected ? `1px solid ${COLORS.atomicTangerine}` : `1px solid ${COLORS.border}`,
                    background: selected ? `${COLORS.atomicTangerine}12` : COLORS.surface,
                    cursor: 'pointer',
                    color: selected ? COLORS.atomicTangerine : COLORS.textPrimary,
                    fontWeight: selected ? '700' : '400',
                    fontSize: '0.875rem',
                    transition: TRANSITIONS.fast,
                  }}
                >
                  {t(`vibes.${VIBE_KEY_MAP[v]}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>{t('labels.companions')}</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <input
            placeholder={t('labels.nameOrEmail')}
            value={companionDraft || ''}
            onChange={(e) => onCompanionSearch(e.target.value)}
            maxLength={100}
            style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: RADIUS.sm, border: `1px solid ${COLORS.border}`, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={() => companionDraft && companionDraft.trim() && onAddCompanionFreeform(companionDraft)}
            style={styles.secondaryBtn(!companionDraft?.trim())}
          >
            {t('labels.addCompanion')}
          </button>
        </div>

        {companionResults.length > 0 && (
          <div
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.sm,
              marginTop: 8,
              maxHeight: 160,
              overflowY: 'auto',
              background: COLORS.surface,
            }}
          >
            {companionResults.map((u) => (
              <div
                key={u.uid}
                style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 8 }}
                onClick={() => onAddCompanionFromResult(u)}
              >
                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{u.displayName || u.email}</strong>
                  <div style={{ fontSize: '0.75rem', color: COLORS.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddCompanionFromResult(u);
                  }}
                  style={styles.secondaryBtnSm}
                >
                  {t('labels.addCompanion')}
                </button>
              </div>
            ))}
          </div>
        )}

        {companionResults.length === 0 && companionDraft && companionDraft.includes('@') && (
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              style={styles.secondaryBtnSm}
              onClick={() => onAddCompanionFreeform(companionDraft)}
            >
              {t('labels.inviteByEmail', { email: companionDraft })}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {(formData.companions || []).map((c, idx) => (
              <div
              key={idx}
              style={{
                padding: '5px 10px',
                borderRadius: RADIUS.md,
                background: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                maxWidth: '200px',
              }}
            >
              <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{c.name}</span>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    companions: prev.companions.filter((_, i) => i !== idx),
                  }))
                }
                aria-label={t('labels.removeCompanion', { name: c.name })}
                style={{ background: 'transparent', border: 'none', color: COLORS.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EdicionContextSection;
