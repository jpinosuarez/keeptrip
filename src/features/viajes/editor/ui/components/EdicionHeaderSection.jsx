import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { LoaderCircle, CalendarDays, MapPinned, Sparkles } from 'lucide-react';
import { getCountryFlagEmoji, getFlagUrl, normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

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
  onRegenerateTitle,
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
    <section className="bg-background p-0 flex flex-col shrink-0">
      <div className={cn(
        "bg-surface border border-border shadow-sm rounded-[20px] flex flex-col gap-4 relative overflow-hidden",
        isMobile ? "px-3.5 py-4" : "px-4.5 py-5"
      )}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-atomicTangerine to-mutedTeal opacity-75 pointer-events-none" aria-hidden="true" />

        <div className="flex justify-between items-start gap-2.5 flex-wrap">
          <span className="min-h-[44px] inline-flex items-center rounded-full px-3.5 bg-background border border-border text-textTertiary text-[0.72rem] font-extrabold uppercase tracking-wider">
            {esBorrador ? t('labels.draft', 'Borrador') : t('labels.editing', 'Editando')}
          </span>

          <div className="flex gap-2 items-center flex-wrap">
            {isProcessingImage && (
              <div className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full px-3.5 bg-warning/10 border border-warning/25 text-[#B45309] text-[0.72rem] font-bold">
                <LoaderCircle size={14} className="animate-spin" />
                <span>{t('optimizing', 'Optimizando...')}</span>
              </div>
            )}

            {esBorrador && (
              <button
                type="button"
                onClick={onToggleTituloAuto}
                disabled={isBusy}
                className={cn(
                  "min-h-[44px] inline-flex items-center rounded-full px-3.5 text-[0.68rem] font-extrabold uppercase tracking-widest transition-all",
                  isTituloAuto ? "bg-danger/10 border border-danger/25 text-danger" : "bg-background border border-border text-textSecondary",
                  isBusy && "opacity-70 cursor-not-allowed"
                )}
                title={isTituloAuto ? t('tooltip.autoUpdate', 'Modo automático') : t('tooltip.manualMode', 'Modo manual')}
              >
                {isTituloAuto ? t('labels.autoTitle', 'AUTO') : t('labels.manualTitle', 'MANUAL')}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {!esBorrador && !isTituloAuto && (
            <button
              type="button"
              onClick={onRegenerateTitle}
              disabled={isBusy}
              className={cn(
                "min-h-[40px] self-start inline-flex items-center gap-1.5 rounded-full px-3.5 bg-atomicTangerine/10 border border-atomicTangerine/25 text-atomicTangerine text-[0.74rem] font-bold transition-all",
                isBusy && "opacity-70 cursor-not-allowed"
              )}
              aria-label={t('editor.header.regenerateTitleBtn', { defaultValue: 'Generar título automático' })}
            >
              <Sparkles size={14} />
              {t('editor.header.regenerateTitleBtn', { defaultValue: 'Generar título automático' })}
            </button>
          )}

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
            style={{ fontSize: `${titleFontSize}px` }}
            className={cn(
              "w-full bg-transparent outline-none text-textPrimary font-heading font-extrabold leading-[1.2] tracking-[-0.02em] min-h-[52px] max-h-[52px] p-0 m-0 caret-atomicTangerine overflow-hidden line-clamp-2",
              "border-b border-dashed border-slate-300 transition-all",
              "focus:border-solid focus:border-atomicTangerine focus:bg-atomicTangerine/10 focus:text-slate-800",
              "placeholder:text-slate-400 placeholder:font-bold"
            )}
            rows={2}
            ref={titleTextareaRef}
            onInput={() => {
              adjustTitleFont();
              adjustTitleHeight();
            }}
          />
          <small className="text-[0.75rem] text-textTertiary mt-[-4px] mb-2 block">{t('labels.titleEditableHint', 'Toca para editar el título')}</small>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center">
              {dedupedFlagVisuals.length > 0 ? (
                dedupedFlagVisuals.map((flagVisual, idx) => {
                  const commonClasses = cn(
                    "w-[30px] h-[30px] rounded-full border-2 border-surface shadow-sm bg-surface shrink-0 relative",
                    idx > 0 && "-ml-2.5"
                  );
                  const commonStyles = { zIndex: 10 - idx };

                  if (flagVisual.type === 'emoji') {
                    return (
                      <span
                        key={`${flagVisual.type}-${flagVisual.value}-${idx}`}
                        role="img"
                        aria-label={t('labels.flagAlt', 'Country flag')}
                        className={cn(commonClasses, "inline-flex items-center justify-center text-[1rem] leading-none")}
                        style={commonStyles}
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
                      className={cn(commonClasses, "object-cover inline-block")}
                      style={commonStyles}
                      loading="lazy"
                      onError={(e) => {
                        const fallbackEmoji = flagVisual.fallbackEmoji || '🌍';
                        const replacement = document.createElement('span');
                        replacement.setAttribute('aria-label', t('labels.flagAlt', 'Country flag'));
                        replacement.textContent = fallbackEmoji;
                        replacement.className = cn(commonClasses, "inline-flex items-center justify-center text-[1rem] leading-none");
                        Object.assign(replacement.style, commonStyles);
                        e.currentTarget.replaceWith(replacement);
                      }}
                    />
                  );
                })
              ) : (
                <span
                  role="img"
                  aria-label={t('labels.flagAlt', 'Country flag')}
                  className="w-[30px] h-[30px] rounded-full border-2 border-surface shadow-sm bg-surface inline-flex items-center justify-center text-[1rem] leading-none shrink-0 relative z-10"
                >
                  🌍
                </span>
              )}
            </div>
            <span className="text-[0.85rem] text-textSecondary font-bold">
              {locationText}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="min-h-[44px] inline-flex items-center gap-1.5 rounded-md px-3 bg-background border border-border text-textTertiary text-[0.78rem] font-bold">
              <MapPinned size={14} className="text-textSecondary shrink-0" />
              {countrySummary}
            </span>

            <span className="min-h-[44px] inline-flex items-center gap-1.5 rounded-md px-3 bg-background border border-border text-textTertiary text-[0.78rem] font-bold">
              <CalendarDays size={14} className="text-textSecondary shrink-0" />
              {dateRangeText}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EdicionHeaderSection;
