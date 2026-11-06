import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, Plus } from 'lucide-react';

/**
 * EmptyWishlistState — warm, evocative empty state for the "Mi Wishlist" tab.
 * Copy follows the Keeptrip voice ("bucket list", no deprecated vocabulary).
 */
const EmptyWishlistState = ({ onAdd }) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
      <div className="w-16 h-16 rounded-full bg-[#45B0A8]/12 flex items-center justify-center">
        <Bookmark size={28} className="text-[#45B0A8]" />
      </div>
      <h3 className="m-0 text-xl font-extrabold text-[#1E293B] font-heading">
        {t('wishlist.empty.title', 'Tu bucket list te espera')}
      </h3>
      <p className="m-0 max-w-md text-sm text-[#64748B]">
        {t(
          'wishlist.empty.description',
          'Guarda países y ciudades que sueñas visitar. Cuando estés listo, conviértelos en tu próxima aventura.'
        )}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-full bg-[#FF6B35] text-white font-bold border-none cursor-pointer shadow-[0_6px_20px_rgba(255,107,53,0.4)] font-heading"
      >
        <Plus size={16} />
        {t('wishlist.empty.cta', 'Añadir mi primer destino')}
      </button>
    </div>
  );
};

export default EmptyWishlistState;
