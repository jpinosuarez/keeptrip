import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, Plus } from 'lucide-react';

/**
 * EmptyWishlistState — warm, aspirational empty state for the "Mi Wishlist" tab.
 * Block-level design (mirrors GhostEmptyState/MapEmptyState convention): a
 * bounded, centered white card with block <h3>/<p> so the copy always spans the
 * card width and wraps normally — no flex-column shrink-wrap possible.
 * Copy follows the Keeptrip voice (Clear-evoking, "tú", niche travel vocabulary).
 */
export default function EmptyWishlistState({ onAdd }) {
  const { t } = useTranslation(['dashboard']);

  return (
    <div className="mx-auto block w-full max-w-[480px] rounded-[24px] border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-sm">
      {/* Icon Badge */}
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#45B0A8]/10 text-[#45B0A8]">
        <Bookmark className="fill-[#45B0A8]/20" size={28} />
      </div>

      {/* Heading */}
      <h3 className="block w-full font-heading text-xl font-bold text-slate-800 leading-snug">
        {t('dashboard:wishlist.empty.title', 'Tu bucket list te espera')}
      </h3>

      {/* Description Paragraph */}
      <p className="mt-3 block w-full text-sm sm:text-base text-slate-500 leading-relaxed whitespace-normal break-normal">
        {t(
          'dashboard:wishlist.empty.description',
          'Guarda países y ciudades que sueñas visitar. Cuando estés listo, conviértelos en tu próxima aventura.'
        )}
      </p>

      {/* CTA Button */}
      <div className="mt-8 flex justify-center w-full">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-[48px] min-w-[240px] items-center justify-center gap-2 rounded-full bg-[#FF6B35] hover:bg-[#e85a26] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>{t('dashboard:wishlist.empty.cta', 'Añadir destino')}</span>
        </button>
      </div>
    </div>
  );
}
