import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import { COLORS, RADIUS, SHADOWS } from '@shared/config';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { updateOperationalFlagsLevel } from '../api/operationalFlagsRepository';
import { getOperationalLevelMetadata, OPERATIONAL_LEVELS } from '../model/operationalLevels';

const getAccentColor = (level) => {
  if (level >= 2) return COLORS.atomicTangerine;
  if (level === 1) return COLORS.warning;
  return COLORS.mutedTeal;
};

const getBackgroundTint = (level) => {
  if (level >= 3) return 'rgba(255, 107, 53, 0.1)';
  if (level === 2) return 'rgba(255, 107, 53, 0.08)';
  if (level === 1) return 'rgba(245, 158, 11, 0.08)';
  return 'rgba(69, 176, 168, 0.08)';
};

const OperationalControlsSection = ({
  canManageOperationalFlags = false,
  currentUser = null,
  onNotify,
}) => {
  const { t } = useTranslation(['settings', 'common']);
  const { flags, loading, error } = useOperationalFlags();

  const [pendingLevel, setPendingLevel] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const activeLevel = Number.isInteger(flags?.level) ? flags.level : 0;
  const activeLevelMeta = getOperationalLevelMetadata(activeLevel);
  const pendingLevelMeta = pendingLevel === null ? null : getOperationalLevelMetadata(pendingLevel);

  const levelRows = useMemo(() => {
    return OPERATIONAL_LEVELS.map((entry) => {
      const isActive = entry.level === activeLevel;
      const accentColor = getAccentColor(entry.level);

      return {
        ...entry,
        isActive,
        accentColor,
        background: isActive ? getBackgroundTint(entry.level) : 'transparent',
      };
    });
  }, [activeLevel]);

  if (!canManageOperationalFlags) {
    return null;
  }

  const requestLevelChange = (nextLevel) => {
    if (nextLevel === activeLevel || isUpdating) return;
    setPendingLevel(nextLevel);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (isUpdating) return;
    setIsConfirmOpen(false);
    setPendingLevel(null);
  };

  const confirmLevelChange = async () => {
    if (pendingLevel === null || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateOperationalFlagsLevel({
        level: pendingLevel,
        updatedByUid: currentUser?.uid || null,
      });

      onNotify?.(
        t('settings:operationalControls.toast.success', {
          levelName: t(pendingLevelMeta?.nameKey || 'settings:operationalControls.levels.0.name'),
        }),
        'success'
      );
      closeConfirm();
    } catch (updateError) {
      console.error('Operational level update failed:', updateError);
      const errorKey =
        updateError?.code === 'permission-denied'
          ? 'settings:operationalControls.toast.permissionDenied'
          : 'settings:operationalControls.toast.error';
      onNotify?.(t(errorKey), 'error');
      setIsConfirmOpen(false);
      setPendingLevel(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p
        style={{
          margin: '0 0 8px 6px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: COLORS.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
        }}
      >
        {t('settings:operationalControls.sectionTitle')}
      </p>

      <div
        style={{
          background: '#fff',
          borderRadius: RADIUS.xl,
          boxShadow: SHADOWS.sm,
          border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.05)'}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: RADIUS.md,
              background: getBackgroundTint(activeLevel),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={16} color={getAccentColor(activeLevel)} strokeWidth={2} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: COLORS.charcoalBlue,
                lineHeight: 1.3,
              }}
            >
              {t('settings:operationalControls.title')}
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '0.78rem',
                color: COLORS.textSecondary,
                lineHeight: 1.35,
              }}
            >
              {t('settings:operationalControls.description')}
            </p>
          </div>
        </div>

        <div style={{ padding: '14px 14px 8px' }}>
          {loading ? (
            <div
              style={{
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: COLORS.textSecondary,
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '0 8px 8px',
              }}
            >
              <LoaderCircle className="spin" size={16} />
              {t('settings:operationalControls.loading')}
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 8px 10px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {t('settings:operationalControls.currentLevelLabel')}
                </span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: RADIUS.full,
                    background: getBackgroundTint(activeLevel),
                    border: `1px solid ${getAccentColor(activeLevel)}40`,
                    color: getAccentColor(activeLevel),
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {t('settings:operationalControls.levelBadge', {
                    level: activeLevel,
                    levelName: t(activeLevelMeta.nameKey),
                  })}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {levelRows.map((entry) => (
                  <button
                    key={entry.level}
                    type="button"
                    onClick={() => requestLevelChange(entry.level)}
                    disabled={entry.isActive || isUpdating}
                    style={{
                      width: '100%',
                      minHeight: '52px',
                      borderRadius: RADIUS.md,
                      border: `1px solid ${entry.isActive ? `${entry.accentColor}66` : 'rgba(0, 0, 0, 0.08)'}`,
                      background: entry.background,
                      padding: '10px 12px',
                      cursor: entry.isActive ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      textAlign: 'left',
                      opacity: isUpdating && !entry.isActive ? 0.6 : 1,
                    }}
                    aria-label={t('settings:operationalControls.applyLevelLabel', {
                      level: entry.level,
                      levelName: t(entry.nameKey),
                    })}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: entry.isActive ? entry.accentColor : COLORS.charcoalBlue,
                          lineHeight: 1.2,
                        }}
                      >
                        {t('settings:operationalControls.levelLabel', {
                          level: entry.level,
                          levelName: t(entry.nameKey),
                        })}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: COLORS.textSecondary,
                          lineHeight: 1.3,
                        }}
                      >
                        {t(entry.descriptionKey)}
                      </span>
                    </span>

                    {entry.isActive ? (
                      <span
                        style={{
                          minHeight: '28px',
                          padding: '6px 10px',
                          borderRadius: RADIUS.full,
                          border: `1px solid ${entry.accentColor}55`,
                          background: '#fff',
                          color: entry.accentColor,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        {t('settings:operationalControls.activeLabel')}
                      </span>
                    ) : (
                      <span
                        style={{
                          minHeight: '28px',
                          padding: '6px 10px',
                          borderRadius: RADIUS.full,
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          color: COLORS.textSecondary,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {t('settings:operationalControls.applyLabel')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <p
              style={{
                margin: '10px 8px 2px',
                fontSize: '0.76rem',
                color: COLORS.danger,
                lineHeight: 1.35,
              }}
            >
              {t('settings:operationalControls.fetchError')}
            </p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={t('settings:operationalControls.confirmTitle')}
        message={t('settings:operationalControls.confirmMessage', {
          from: t(activeLevelMeta.nameKey),
          to: t(pendingLevelMeta?.nameKey || activeLevelMeta.nameKey),
        })}
        confirmText={t('settings:operationalControls.confirmButton')}
        cancelText={t('common:cancel')}
        onConfirm={confirmLevelChange}
        onClose={closeConfirm}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default OperationalControlsSection;
