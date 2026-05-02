import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@app/providers/AuthContext';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { cn } from '@shared/lib/utils/cn';
import BottomSheet from '@shared/ui/components/BottomSheet';

function getInitials(name) {
  if (!name) return '';
  return name.split(' ').map(w => w[0]).join('').toUpperCase();
}

const ProfileModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common');
  const { user, updateUserProfile } = useAuth();
  const { isMobile } = useWindowSize(768);
  const [name, setName] = useState(user?.displayName || '');
  const [photo, setPhoto] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateUserProfile(name, photo);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const avatarFallback = (
    <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center font-black text-text-secondary text-[2rem]">
      {getInitials(name) || t('profile.avatarFallback')}
    </div>
  );

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden self-center mb-2.5 border-2 border-atomicTangerine bg-white/10 flex items-center justify-center relative">
        {!photo || !imgLoaded ? avatarFallback : null}
        {photo && (
          <img
            src={photo}
            alt={t('profile.avatarAlt')}
            className="w-full h-full object-cover block"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(false)}
          />
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <label className="text-[0.8rem] font-bold text-charcoalBlue uppercase tracking-wide">{t('profile.nameLabel')}</label>
        <input
          className="w-full p-3 rounded-lg border border-border bg-white text-base focus:ring-2 focus:ring-atomicTangerine/20 focus:border-atomicTangerine outline-none transition-all font-medium"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('profile.namePlaceholder')}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[0.8rem] font-bold text-charcoalBlue uppercase tracking-wide">{t('profile.photoLabel')}</label>
        <input
          className="w-full p-3 rounded-lg border border-border bg-white text-base focus:ring-2 focus:ring-atomicTangerine/20 focus:border-atomicTangerine outline-none transition-all font-medium"
          value={photo}
          onChange={e => setPhoto(e.target.value)}
          placeholder={t('profile.photoPlaceholder')}
        />
      </div>
      <Motion.button 
        type="submit" 
        className="mt-1 py-3.5 bg-atomicTangerine text-white font-black rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
        disabled={loading} 
        whileTap={{ scale: 0.98 }}
      >
        <Save size={18} /> {loading ? t('profile.saving') : t('profile.save')}
      </Motion.button>
    </form>
  );

  // Mobile: BottomSheet
  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={11000} disableClose={loading}>
        <div className="px-5 py-1 pb-2">
          <h3 className="text-charcoalBlue font-black text-xl mb-4 font-heading">{t('profile.editTitle')}</h3>
          {formContent}
        </div>
      </BottomSheet>
    );
  }

  // Desktop: modal centrado
  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[11000] bg-black/40 backdrop-blur-md flex items-center justify-center"
        onClick={onClose}
      >
        <Motion.div
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-[30px] w-[400px] max-w-[90%] shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="m-0 text-charcoalBlue font-black font-heading">{t('profile.editTitle')}</h3>
            <Motion.button 
              onClick={onClose} 
              className="w-11 h-11 rounded-full flex items-center justify-center border-none bg-none cursor-pointer hover:bg-slate-100 transition-colors"
              aria-label={t('profile.close')} 
              whileTap={{ scale: 0.98 }}
            > 
              <X size={20}/> 
            </Motion.button>
          </div>
          {formContent}
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default ProfileModal;
