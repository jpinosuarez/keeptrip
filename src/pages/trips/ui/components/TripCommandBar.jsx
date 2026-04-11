import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, List } from 'lucide-react';
import { COLORS, RADIUS } from '@shared/config';
import { useToast } from '@app/providers';

const TripCommandBar = ({ activeFilter, onFilterChange }) => {
  const { t } = useTranslation('dashboard');
  const { pushToast } = useToast();
  const handleListToggle = () => { pushToast(t('toast.comingSoon'), 'info'); };

  const filterBtnStyle = (active) => ({
    padding: '6px 14px',
    borderRadius: RADIUS.full,
    border: `1px solid ${active ? COLORS.atomicTangerine : COLORS.border}`,
    background: active ? `${COLORS.atomicTangerine}15` : 'transparent',
    color: active ? COLORS.atomicTangerine : COLORS.charcoalBlue,
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    whiteSpace: 'nowrap',
    minHeight: '40px',
  });

  const iconBtnStyle = (active) => ({
    background: 'none',
    border: 'none',
    cursor: active ? 'default' : 'pointer',
    padding: '8px',
    color: active ? COLORS.atomicTangerine : COLORS.textSecondary,
    opacity: active ? 1 : 0.6,
    minHeight: '40px',
    minWidth: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease-out, opacity 0.2s ease-out',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      paddingBottom: '8px',
    }}>
      <div style={{
        padding: '8px 0 0',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button style={filterBtnStyle(activeFilter === 'all')} onClick={() => onFilterChange('all')}>{t('filters.all')}</button>
          <button style={filterBtnStyle(activeFilter === 'year')} onClick={() => onFilterChange('year')}>{t('filters.year')}</button>
        </div>
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <button style={iconBtnStyle(true)} title={t('viewGrid')} aria-label={t('viewGrid')}><LayoutGrid size={18} strokeWidth={1.8} /></button>
          <button style={iconBtnStyle(false)} onClick={handleListToggle} title={t('viewList')} aria-label={t('viewList')}><List size={18} strokeWidth={1.8} /></button>
        </div>
      </div>
    </div>
  );
};
export default React.memo(TripCommandBar);