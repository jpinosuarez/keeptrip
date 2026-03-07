import React from 'react';
import { Calendar } from 'lucide-react';
import { COLORS } from '../../../../../theme';
import CityManager from '../../../../../components/Shared/CityManager';

const EdicionParadasSection = ({ styles, t, paradas, setParadas, fechaRangoDisplay, sinParadas }) => {
  return (
    <div style={styles.section}>
      <label style={styles.label}>
        <Calendar size={14} /> {t('labels.paradas')}
      </label>
      {fechaRangoDisplay && (
        <span style={{ fontSize: '0.82rem', color: COLORS.textSecondary, marginBottom: 6, display: 'block' }}>
          {`📅 ${fechaRangoDisplay}`}
        </span>
      )}
      <CityManager paradas={paradas} setParadas={setParadas} />
      {sinParadas && <span style={styles.inlineError}>{t('labels.addCityWarning')}</span>}
    </div>
  );
};

export default EdicionParadasSection;
