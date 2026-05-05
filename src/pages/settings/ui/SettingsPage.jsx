/**
 * SettingsPage — 2026 iOS-Style Grouped List (v12)
 *
 * Architecture:
 *   - Migrated from bento cards → iOS Settings grouped rows
 *   - Removed dead sections: Appearance (dark mode "coming soon"), Map Style (all disabled)
 *   - Auto-save on blur with debounce (Guardrail #4)
 *   - Live avatar preview (URL → instant preview, no save required to see)
 *   - Unified color system: atomicTangerine for saves, danger for destructive actions
 */
import React, { useState, useCallback, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import {
  User, Globe, LogOut, ChevronRight,
  CheckCircle, Camera, Pencil, Trash2
} from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext';
import { useToast } from '@app/providers/ToastContext';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { auth, storage } from '@shared/firebase';
import { OperationalControlsSection } from '@features/admin-controls';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';
import { compressImage } from '@shared/lib/utils/imageUtils';
import { cn } from '@shared/lib/utils/cn';

const DEBOUNCE_MS = 800;
const FOUNDER_UID_FALLBACK = 'FOUNDER_UID_HERE';

/* ── Reusable iOS-style Settings Row ─────────────────────────────────── */
const SettingsRow = ({
  icon: RowIcon,
  label,
  description,
  onClick,
  danger = false,
  trailing,
  isLast = false,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3.5 w-full min-h-[56px] px-[18px] py-3.5 bg-transparent border-none cursor-pointer text-left transition-colors outline-none",
        !isLast && "border-b border-black/5"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        danger ? "bg-red-50" : "bg-orange-50"
      )}>
        {RowIcon && (
          <RowIcon
            size={16}
            className={danger ? "text-red-500" : "text-atomicTangerine"}
            strokeWidth={2}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn(
          "block text-[0.92rem] font-semibold leading-snug",
          danger ? "text-red-500" : "text-charcoalBlue"
        )}>
          {label}
        </span>
        {description && (
          <span className="block text-[0.76rem] text-text-secondary mt-0.5 leading-snug">
            {description}
          </span>
        )}
      </div>

      {trailing || (
        <ChevronRight size={16} className="text-text-secondary shrink-0 opacity-50" />
      )}
    </Motion.div>
  );
};

/* ── Section Header (iOS uppercase group label) ──────────────────────── */
const SectionHeader = ({ children }) => (
  <p className="mx-1.5 mb-2 text-[0.72rem] font-bold text-text-secondary uppercase tracking-[0.6px]">
    {children}
  </p>
);

/* ── Grouped Card Container ──────────────────────────────────────────── */
const GroupCard = ({ children, className }) => (
  <div className={cn(
    "bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden",
    className
  )}>
    {children}
  </div>
);

/* ── Language Toggle Trailing ────────────────────────────────────────── */
const LanguageToggle = ({ currentLang, onToggle }) => {
  const languages = [
    { code: 'es', label: 'Español', flagUrl: 'https://flagcdn.com/es.svg' },
    { code: 'en', label: 'English', flagUrl: 'https://flagcdn.com/us.svg' },
  ];

  return (
    <div className="flex gap-1.5 shrink-0">
      {languages.map((lang) => {
        const active = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(lang.code); }}
            className={cn(
              "w-9 h-7 rounded-md flex items-center justify-center transition-all p-0 cursor-pointer",
              active ? "border-2 border-atomicTangerine bg-orange-50" : "border border-black/10 bg-transparent"
            )}
            aria-label={lang.code === 'es' ? 'Cambiar a español' : 'Switch to English'}
            title={lang.label}
          >
            <img
              src={lang.flagUrl}
              alt={lang.label}
              className="w-6 h-6 rounded-full object-cover shadow-sm block"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </button>
        );
      })}
    </div>
  );
};

/* ── Main SettingsPage ───────────────────────────────────────────────── */
const SettingsPage = () => {
  const {
    usuario: user,
    actualizarPerfilUsuario: updateUserProfile,
    logout,
    isAdmin,
  } = useAuth();
  const { pushToast } = useToast();
  const { t, i18n } = useTranslation(['settings', 'common', 'nav']);
  const { t: tNav } = useTranslation('nav');
  useDocumentTitle(tNav('settings'));

  const founderUid = import.meta.env.VITE_FOUNDER_UID || FOUNDER_UID_FALLBACK;
  const hasFounderUidAccess = Boolean(user?.uid && user.uid === founderUid);
  const canManageOperationalFlags = hasFounderUidAccess;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL || '');
  const [savedMsg, setSavedMsg] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const debounceRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-save on blur (Guardrail #4)
  const handleSaveOnBlur = useCallback(async () => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (displayName === (user?.displayName || '') && photoUrl === (user?.photoURL || '')) return;
      const ok = await updateUserProfile(displayName, photoUrl);
      setSavedMsg(ok ? t('settings:toast.success') : t('settings:toast.error'));
      setTimeout(() => setSavedMsg(''), 2500);
    }, DEBOUNCE_MS);
  }, [displayName, photoUrl, user, updateUserProfile, t]);

  const handleAvatarUploadClick = () => fileInputRef.current?.click();

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setUploadProgress(0);
    try {
      const { blob } = await compressImage(file, 1024, 0.8, (progress) => setUploadProgress(progress));
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('No authenticated user');
      const avatarRef = ref(storage, `usuarios/${userId}/avatars/avatar.jpg`);
      await uploadBytes(avatarRef, blob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(avatarRef);
      setPhotoUrl(url);
      await updateUserProfile(displayName, url);
      pushToast(t('settings:avatarUploadSuccess', 'Avatar updated!'), 'success');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      pushToast(t('settings:avatarUploadError', 'Failed to upload avatar.'), 'error');
    } finally {
      setUploadingAvatar(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsDeletingAccount(true);
    try {
      await deleteUser(currentUser);
      pushToast(t('settings:deleteAccountSuccess'), 'success');
      logout();
    } catch (error) {
      console.error('Delete account failed:', error);
      if (error?.code === 'auth/requires-recent-login') {
        pushToast(t('settings:deleteAccountNeedsRelogin'), 'error');
      } else {
        pushToast(t('settings:deleteAccountError'), 'error');
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const initials = user?.displayName?.trim()?.[0]?.toUpperCase() || '';

  return (
    <div className="w-full h-full overflow-y-auto box-border custom-scrollbar">
      <div className="w-full max-w-[640px] mx-auto flex flex-col gap-6 p-4 md:p-6 pb-[100px] md:pb-20">

        {/* ── Identity Card ── */}
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
        >
          <GroupCard>
            <div className="flex gap-[18px] items-center p-6">
              {/* Avatar */}
              <div className="w-[68px] h-[68px] rounded-full overflow-hidden border-[3px] border-black/5 flex-shrink-0 bg-mutedTeal flex items-center justify-center">
                {photoUrl && !photoError ? (
                  <img
                    src={photoUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <div className="text-white font-black text-2xl flex items-center justify-center w-full h-full">
                    {initials || <User size={28} />}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h1 className="m-0 text-xl font-black text-charcoalBlue tracking-tight truncate">
                    {user?.displayName || '—'}
                  </h1>
                  <Motion.button
                    type="button"
                    onClick={() => setEditingProfile(v => !v)}
                    whileTap={{ scale: 0.95 }}
                    className="bg-black/5 border-none rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-text-secondary"
                    aria-label="Edit profile"
                  >
                    <Pencil size={13} />
                  </Motion.button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {user?.email && (
                    <span className="px-2.5 py-0.5 rounded-full text-[0.73rem] font-bold border border-black/5 bg-black/5 text-text-secondary truncate max-w-[180px]">
                      {user.email}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 rounded-full text-[0.73rem] font-extrabold border border-amber-200 bg-amber-50 text-orange-700">
                      {t('settings:admin')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable Edit Form */}
            <AnimatePresence>
              {editingProfile && (
                <Motion.div
                  key="edit-profile"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 border-t border-black/5">
                    {/* Avatar upload */}
                    <div className="mt-4 flex gap-2.5 items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                      <Motion.button
                        type="button"
                        onClick={handleAvatarUploadClick}
                        whileTap={{ scale: 0.98 }}
                        disabled={uploadingAvatar}
                        className="min-h-[40px] px-3.5 rounded-lg border border-black/10 bg-slate-50 text-charcoalBlue font-semibold text-[0.85rem] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Camera size={14} />
                        {uploadingAvatar ? `${Math.round(uploadProgress)}%` : t('settings:avatarUpload')}
                      </Motion.button>
                      <span className="text-[0.78rem] text-text-secondary">
                        {t('settings:avatarHint')}
                      </span>
                    </div>

                    {/* Name + Photo URL fields */}
                    <div className="mt-4 flex flex-col gap-3.5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.8rem] font-bold text-text-secondary">
                          {t('settings:travelerName')}
                        </label>
                        <input
                          className="px-3.5 py-2.5 rounded-lg border border-black/10 text-[0.92rem] outline-none font-body text-charcoalBlue bg-slate-50 w-full box-border focus:border-atomicTangerine transition-colors"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          onBlur={handleSaveOnBlur}
                          placeholder={t('settings:travelerName')}
                        />
                      </div>
                    </div>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </GroupCard>
        </Motion.div>

        {/* ── Account Section ── */}
        <SectionHeader>{t('settings:account', 'Cuenta')}</SectionHeader>
        <GroupCard>
          <SettingsRow
            icon={Trash2}
            label={t('settings:deleteAccount')}
            description={t('settings:deleteAccountMessage')}
            onClick={() => setShowDeleteConfirm(true)}
            danger
            isLast={true}
          />
        </GroupCard>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('settings:deleteAccountTitle')}
        message={t('settings:deleteAccountMessage')}
        confirmText={t('settings:deleteAccountConfirm')}
        cancelText={t('common:cancel')}
        onConfirm={handleDeleteAccount}
        onClose={() => setShowDeleteConfirm(false)}
        isLoading={isDeletingAccount}
      />

      {/* ── App Version Footer ── */}
      <div className="pt-8 mt-6 border-t border-black/5 flex justify-center items-center">
        <span className="text-[0.75rem] text-slate-500 font-medium tracking-wider">
          {/* eslint-disable-next-line no-undef */}
          {t('settings:footer.appVersion', 'App Version')} • {`v${__APP_VERSION__}`}
        </span>
      </div>
    </div>
  );
};

export default SettingsPage;

