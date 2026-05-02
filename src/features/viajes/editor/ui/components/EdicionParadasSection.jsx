import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import CityManager from './CityManager';

const EdicionParadasSection = ({
  t,
  paradas,
  setParadas,
  fechaRangoDisplay,
  tripStartDate,
  sinParadas,
  isReadOnlyMode = false,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-background p-4 rounded-lg border border-border">
      <label className="text-[0.78rem] font-extrabold text-textSecondary uppercase tracking-[0.5px] flex items-center gap-1.5">
        <Calendar size={14} /> {t('labels.paradas')}
      </label>
      {fechaRangoDisplay && (
        <span className="text-[0.82rem] text-textSecondary mb-1.5 block">
          {`📅 ${fechaRangoDisplay}`}
        </span>
      )}
      <CityManager t={t} paradas={paradas} setParadas={setParadas} tripStartDate={tripStartDate} isReadOnlyMode={isReadOnlyMode} />
      {sinParadas && (
        <div
          className="mt-4 p-8 md:p-6 rounded-2xl border-2 border-dashed border-border bg-background flex flex-col items-center justify-center text-center gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 rounded-xl bg-atomicTangerine/10 flex items-center justify-center">
            <MapPin size={32} className="text-atomicTangerine stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-bold text-charcoalBlue m-0 tracking-[-0.01em]">
              {t('labels.emptyStopsTitle', 'Tu ruta está vacía')}
            </h3>
            <p className="text-[0.9rem] text-textSecondary leading-[1.5] m-0 max-w-[280px]">
              {t('labels.emptyStopsDescription', 'Agrega tu primer destino usando la barra de búsqueda arriba para comenzar.')}
            </p>
          </div>
          <div className="mt-2 text-[0.75rem] font-semibold text-atomicTangerine uppercase tracking-[0.5px]">
            {t('labels.emptyStopsHint', 'Necesitas al menos 1 parada para guardar')}
          </div>
        </div>
      )}
    </div>
  );
};

export default EdicionParadasSection;
