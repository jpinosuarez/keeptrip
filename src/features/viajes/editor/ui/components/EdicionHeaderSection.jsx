import React from 'react';
import { Camera, LoaderCircle } from 'lucide-react';

const EdicionHeaderSection = ({
  styles,
  t,
  formData,
  isMobile,
  isBusy,
  esBorrador,
  isTituloAuto,
  titlePulse,
  isProcessingImage,
  onTituloChange,
  onToggleTituloAuto,
  onFileChange,
}) => {
  return (
    <div style={styles.header(formData.foto, isMobile)}>
      <div style={styles.headerOverlay} />
      <div style={styles.headerContent}>
        {formData.flag ? (
          <img src={formData.flag} alt="Bandera" style={styles.flagImg} onError={(e) => (e.target.style.display = 'none')} />
        ) : (
          <span style={{ fontSize: '3rem' }}>🌍</span>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              name="titulo"
              value={formData.titulo || ''}
              onChange={(e) => onTituloChange(e.target.value)}
              style={titlePulse ? styles.titleInputAutoPulse : styles.titleInput}
              placeholder={t('tripTitlePlaceholder')}
              maxLength={80}
              disabled={isBusy}
            />
            {esBorrador && (
              <button
                type="button"
                style={styles.autoBadge(isTituloAuto)}
                title={isTituloAuto ? t('tooltip.autoUpdate') : t('tooltip.manualMode')}
                onClick={onToggleTituloAuto}
                disabled={isBusy}
              >
                {isTituloAuto ? t('autoTitle') : t('manualTitle')}
              </button>
            )}
          </div>
        </div>
      </div>
      {isProcessingImage && (
        <div style={styles.processingBadge}>
          <LoaderCircle size={14} className="spin" />
          {t('optimizing')}
        </div>
      )}
      <label style={styles.cameraBtn(isBusy)}>
        <Camera size={18} />
        <input type="file" hidden onChange={onFileChange} accept="image/jpeg,image/png" disabled={isBusy} />
      </label>
    </div>
  );
};

export default EdicionHeaderSection;
