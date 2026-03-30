import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, List } from 'lucide-react';
import { COLORS, RADIUS } from '@shared/config';
import { useToast } from '@app/providers';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';

const TripCommandBar = ({ activeFilter, onFilterChange, logStats = null }) => {
  const { t } = useTranslation('dashboard');
  const { pushToast } = useToast();
  const handleListToggle = () => { pushToast(t('toast.comingSoon'), 'info'); };
  const filterBtnStyle = (active) => ({
    padding: '7px 16px',
    borderRadius: RADIUS.full,
    border: `1px solid ${active ? COLORS.atomicTangerine : COLORS.border}`,
    background: active ? `${COLORS.atomicTangerine}12` : 'transparent',
    color: active ? COLORS.atomicTangerine : COLORS.charcoalBlue,
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    whiteSpace: 'nowrap',
    minHeight: '44px',
  });
  const iconBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    color: COLORS.textSecondary,
    minHeight: '44px',
    minWidth: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease-out',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px', borderBottom: `1px solid ${COLORS.border}` }}>
      {logStats && (
        <TravelStatsWidget
          logStats={logStats}
          ariaLabel={t('stats.tripSummary')}
          variant="trips"
        />
      )}
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={filterBtnStyle(activeFilter === 'all')} onClick={() => onFilterChange('all')}>{t('filters.all')}</button>
          <button style={filterBtnStyle(activeFilter === 'year')} onClick={() => onFilterChange('year')}>{t('filters.year')}</button>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button style={{ ...iconBtnStyle, color: COLORS.atomicTangerine }} title={t('viewGrid')} aria-label={t('viewGrid')}><LayoutGrid size={20} /></button>
          <button style={iconBtnStyle} onClick={handleListToggle} title={t('viewList')} aria-label={t('viewList')}><List size={20} /></button>
        </div>
      </div>
    </div>
  );
};
export default React.memo(TripCommandBar);