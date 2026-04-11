import React from 'react';
import { LoaderCircle, CalendarDays, MapPinned } from 'lucide-react';
import { getCountryFlagEmoji, getFlagUrl, normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { styles } from './EdicionHeaderSection.styles';
import './EdicionHeaderSection.css';

const EdicionHeaderSection = ({
  t,
  formData,
  isMobile,
  isBusy,
  esBorrador,
  isTituloAuto,
  isProcessingImage,
  paradas = [],
  onTituloChange,
  onToggleTituloAuto,
}) => {
  const titleTextareaRef = React.useRef(null);
  const [titleFontSize, setTitleFontSize] = React.useState(isMobile ? 20 : 22);

  const adjustTitleHeight = React.useCallback(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 1.25;
    const maxHeight = lineHeight * 2;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
  }, []);

  const adjustTitleFont = React.useCallback(() => {
    const el = titleTextareaRef.current;
    if (!el) return;

    const containerWidth = el.clientWidth || el.parentElement?.clientWidth || 1;
    const maxSize = isMobile ? 22 : 26;
    const minSize = isMobile ? 14 : 16;
    const target = Math.round(Math.max(minSize, Math.min(maxSize, maxSize - (formData?.titulo?.length || 0) * 0.12)));

    if (target !== titleFontSize) {
      setTitleFontSize(target);
    }

    // En caso de texto muy largo, reduce aún más caso necesario basado en scroll.
    let recalculated = target;
    while (el.scrollWidth > containerWidth && recalculated > minSize) {
      recalculated -= 1;
      el.style.fontSize = `${recalculated}px`;
    }
    if (recalculated !== target) {
      setTitleFontSize(recalculated);
    }

    el.style.fontSize = `${recalculated}px`;
  }, [formData?.titulo, isMobile, titleFontSize]);

  React.useEffect(() => {
    adjustTitleFont();
    adjustTitleHeight();
  }, [adjustTitleFont, adjustTitleHeight]);

  const normalizedStopCountries = [...new Set(
    (Array.isArray(paradas) ? paradas : [])
      .map((parada) => normalizeCountryCode(parada?.paisCodigo || parada?.code || null))
      .filter(Boolean)
  )];

  const fallbackFormCountry = normalizeCountryCode(formData?.code || formData?.paisCodigo || formData?.countryCode || null);
  const legacyCountryName = formData?.nombreEspanol || formData?.nameSpanish || '';
  const normalizedCountries = normalizedStopCountries.length > 0
    ? normalizedStopCountries
    : [...new Set([fallbackFormCountry].filter(Boolean))];
  const hasStops = normalizedStopCountries.length > 0;

  const isMultiCountry = normalizedCountries.length > 1;
  const countryNames = normalizedCountries
    .map((code) => getLocalizedCountryName(code, undefined, t))
    .filter(Boolean);

  const countrySummary = normalizedCountries.length === 0
    ? t('labels.noStopsSummary', 'Sin paradas')
    : normalizedCountries.length === 1
      ? (countryNames[0] || legacyCountryName || t('labels.countryFallback', 'Destino por confirmar'))
      : t('labels.multiCountriesSummary', '{{count}} países', { count: normalizedCountries.length });

  const locationText = !hasStops
    ? t('labels.noStopsRoute', 'Agrega una parada para empezar')
    : isMultiCountry
    ? t('labels.multiCountryRoute', 'Ruta por {{count}} países', { count: normalizedCountries.length })
    : countrySummary;

  const dateRangeText = `${formData?.fechaInicio || '--'} - ${formData?.fechaFin || '--'}`;

  const derivedCountryFlagVisuals = normalizedCountries
    .map((code) => ({
      type: 'image',
      value: getFlagUrl(code),
      fallbackEmoji: getCountryFlagEmoji(code),
    }))
    .filter((flag) => Boolean(flag.value));

  const allFlagVisuals = hasStops
    ? derivedCountryFlagVisuals
    : [];

  const dedupedFlagVisuals = allFlagVisuals
    .filter((flag) => flag?.value)
    .filter((flag, index, arr) => arr.findIndex((item) => `${item.type}-${item.value}` === `${flag.type}-${flag.value}`) === index)
    .slice(0, 4);

  return (
    <section style={styles.section}>
      <div style={styles.card(isMobile)}>
        <div style={styles.brandAccent} aria-hidden="true" />

        <div style={styles.topRow}>
          <span style={styles.draftStatus}>
            {esBorrador ? t('labels.draft', 'Borrador') : t('labels.editing', 'Editando')}
          </span>

          <div style={styles.actionsRow}>
            {isProcessingImage && (
              <div style={styles.processingBadge}>
                <LoaderCircle size={14} className="spin" />
                <span>{t('optimizing', 'Optimizando...')}</span>
              </div>
            )}

            {esBorrador && (
              <button
                type="button"
                onClick={onToggleTituloAuto}
                disabled={isBusy}
                style={styles.autoModeBtn(isTituloAuto, isBusy)}
                title={isTituloAuto ? t('tooltip.autoUpdate', 'Modo automático') : t('tooltip.manualMode', 'Modo manual')}
              >
                {isTituloAuto ? t('labels.autoTitle', 'AUTO') : t('labels.manualTitle', 'MANUAL')}
              </button>
            )}
          </div>
        </div>

        <div style={styles.content}>
          <textarea
            id="trip-title-editor-input"
            name="titulo"
            aria-label={t('tripTitleAriaLabel', 'Título del viaje')}
            value={formData?.titulo || ''}
            onChange={(e) => {
              onTituloChange(e.target.value);
              adjustTitleFont();
              adjustTitleHeight();
            }}
            placeholder={t('tripTitlePlaceholder', 'Título del viaje')}
            maxLength={80}
            disabled={isBusy}
            style={{ ...styles.titleInput(isMobile), fontSize: `${titleFontSize}px` }}
            className="edicion-header-title-input"
            rows={2}
            ref={titleTextareaRef}
            onInput={() => {
              adjustTitleFont();
              adjustTitleHeight();
            }}
          />
          <small style={styles.titleHint}>{t('labels.titleEditableHint', 'Toca para editar el título')}</small>

          <div style={styles.flagsAndLocationRow}>
            <div style={styles.flagsStack}>
              {dedupedFlagVisuals.length > 0 ? (
                dedupedFlagVisuals.map((flagVisual, idx) => {
                  if (flagVisual.type === 'emoji') {
                    return (
                      <span
                        key={`${flagVisual.type}-${flagVisual.value}-${idx}`}
                        role="img"
                        aria-label={t('labels.flagAlt', 'Country flag')}
                        style={styles.flagEmoji(idx)}
                      >
                        {flagVisual.value}
                      </span>
                    );
                  }

                  return (
                    <img
                      key={`${flagVisual.type}-${flagVisual.value}-${idx}`}
                      src={flagVisual.value}
                      alt={t('labels.flagAlt', 'Country flag')}
                      width="24"
                      height="24"
                      style={styles.flagImage(idx)}
                      loading="lazy"
                      onError={(e) => {
                        const fallbackEmoji = flagVisual.fallbackEmoji || '🌍';
                        const replacement = document.createElement('span');
                        replacement.setAttribute('aria-label', t('labels.flagAlt', 'Country flag'));
                        replacement.textContent = fallbackEmoji;
                        Object.assign(replacement.style, styles.flagEmoji(idx));
                        e.currentTarget.replaceWith(replacement);
                      }}
                    />
                  );
                })
              ) : (
                <span
                  role="img"
                  aria-label={t('labels.flagAlt', 'Country flag')}
                  style={styles.flagEmoji(0)}
                >
                  🌍
                </span>
              )}
            </div>
            <span style={styles.locationText}>
              {locationText}
            </span>
          </div>

          <div style={styles.tagsRow}>
            <span style={styles.infoTag}>
              <MapPinned size={14} style={styles.infoTagIcon} />
              {countrySummary}
            </span>

            <span style={styles.infoTag}>
              <CalendarDays size={14} style={styles.infoTagIcon} />
              {dateRangeText}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EdicionHeaderSection;
