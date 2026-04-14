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
import { COLORS, SHADOWS, RADIUS, FONTS } from '@shared/config';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { auth, storage } from '@shared/firebase';
import { OperationalControlsSection } from '@features/admin-controls';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';
import { compressImage } from '@shared/lib/utils/imageUtils';

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
  const iconNode = RowIcon
    ? React.createElement(RowIcon, {
      size: 16,
      color: danger ? COLORS.danger : COLORS.atomicTangerine,
      strokeWidth: 2,
    })
    : null;

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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        minHeight: '56px',
        padding: '14px 18px',
        background: 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
        outline: 'none',
      }}
    >
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: RADIUS.md,
        background: danger ? 'rgba(239, 68, 68, 0.08)' : `rgba(255, 107, 53, 0.08)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {iconNode}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block',
          fontSize: '0.92rem',
          fontWeight: 600,
          color: danger ? COLORS.danger : COLORS.charcoalBlue,
          lineHeight: 1.3,
        }}>
          {label}
        </span>
        {description && (
          <span style={{
            display: 'block',
            fontSize: '0.76rem',
            color: COLORS.textSecondary,
            marginTop: '1px',
            lineHeight: 1.3,
          }}>
            {description}
          </span>
        )}
      </div>

      {trailing || (
        <ChevronRight size={16} color={COLORS.textSecondary} style={{ flexShrink: 0, opacity: 0.5 }} />
      )}
    </Motion.div>
  );
};

/* ── Section Header (iOS uppercase group label) ──────────────────────── */
const SectionHeader = ({ children }) => (
  <p style={{
    margin: '0 0 8px 6px',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  }}>
    {children}
  </p>
);

/* ── Grouped Card Container ──────────────────────────────────────────── */
const GroupCard = ({ children, style = {} }) => (
  <div style={{
    background: '#fff',
    borderRadius: RADIUS.xl,
    boxShadow: SHADOWS.sm,
    border: '1px solid rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

/* ── Language Toggle Trailing ────────────────────────────────────────── */
const LanguageToggle = ({ currentLang, onToggle }) => {
  const languages = [
    { code: 'es', flagEmoji: '🇪🇸', label: 'Español', flagUrl: 'https://flagcdn.com/es.svg' },
    { code: 'en', flagEmoji: '🇺🇸', label: 'English', flagUrl: 'https://flagcdn.com/us.svg' },
  ];

  const iconStyle = {
    width: '20px',
    height: '20px',
    display: 'inline-block',
    textAlign: 'center',
    lineHeight: '20px',
    fontSize: '16px',
    color: COLORS.charcoalBlue,
    fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, Android Emoji, sans-serif',
    textIndent: 0,
  };

  return (
    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
      {languages.map((lang) => {
        const active = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(lang.code); }}
            style={{
              width: '36px',
              height: '28px',
              borderRadius: RADIUS.sm,
              border: active ? `2px solid ${COLORS.atomicTangerine}` : '1px solid rgba(0,0,0,0.1)',
              background: active ? 'rgba(255, 107, 53, 0.08)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              padding: 0,
            }}
            aria-label={
              lang.code === 'es'
                ? 'Cambiar a español'
                : 'Switch to English'
            }
            title={lang.label}
          >
            <img
              src={lang.flagUrl}
              alt={lang.label}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '9999px',
                objectFit: 'cover',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                display: 'block',
              }}
              onError={(e) => {
                const target = e.target;
                if (target && target instanceof HTMLImageElement) {
                  target.style.display = 'none';
                }
              }}
            />
            <span style={{
              ...iconStyle,
              position: 'absolute',
              width: '24px',
              height: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.01,
            }}>
              {lang.flagEmoji}
            </span>
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
  const { isMobile } = useWindowSize(768);
  useDocumentTitle(tNav('settings'));

  const founderUid = import.meta.env.VITE_FOUNDER_UID || FOUNDER_UID_FALLBACK;
  const hasFounderUidAccess = Boolean(user?.uid && user.uid === founderUid);
  // Firestore rules allow writes to operational_flags only for founder UIDs.
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
    <div style={{
      width: '100%',
      maxWidth: '640px',
      margin: '0 auto',
      padding: isMobile ? '16px 16px 100px' : '24px 24px 80px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      overflowX: 'hidden',
      overflowY: 'auto',
      boxSizing: 'border-box',
      height: '100%',
    }}>

      {/* ── Identity Card ── */}
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120 }}
      >
        <GroupCard>
          <div style={{
            display: 'flex',
            gap: '18px',
            alignItems: 'center',
            padding: '24px',
          }}>
            {/* Avatar */}
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid rgba(0,0,0,0.06)',
              flexShrink: 0,
              background: COLORS.mutedTeal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {photoUrl && !photoError ? (
                <img
                  src={photoUrl}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <div style={{
                  color: '#fff', fontWeight: 900, fontSize: '1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: '100%',
                }}>
                  {initials || <User size={28} />}
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h1 style={{
                  margin: 0, fontSize: '1.25rem', fontWeight: 900,
                  color: COLORS.charcoalBlue, letterSpacing: '-0.5px',
                }}>
                  {user?.displayName || '—'}
                </h1>
                <Motion.button
                  type="button"
                  onClick={() => setEditingProfile(v => !v)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'rgba(0,0,0,0.04)',
                    border: 'none',
                    borderRadius: RADIUS.md,
                    width: '32px',
                    height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    color: COLORS.textSecondary,
                  }}
                  aria-label="Edit profile"
                >
                  <Pencil size={13} />
                </Motion.button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {user?.email && (
                  <span style={{
                    padding: '2px 10px', borderRadius: RADIUS.full,
                    fontSize: '0.73rem', fontWeight: 700,
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: 'rgba(0,0,0,0.02)',
                    color: COLORS.textSecondary,
                  }}>
                    {user.email}
                  </span>
                )}
                <span style={{
                  padding: '2px 10px', borderRadius: RADIUS.full,
                  fontSize: '0.73rem', fontWeight: 800,
                  border: `1px solid ${isAdmin ? '#fde68a' : 'rgba(0,0,0,0.06)'}`,
                  background: isAdmin ? '#fff7ed' : 'rgba(0,0,0,0.02)',
                  color: isAdmin ? '#c2410c' : COLORS.textSecondary,
                }}>
                  {isAdmin ? t('settings:admin') : t('settings:user')}
                </span>
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
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: '0 24px 24px',
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                }}>
                  {/* Avatar upload */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFileChange}
                    />
                    <Motion.button
                      type="button"
                      onClick={handleAvatarUploadClick}
                      style={{
                        minHeight: '40px',
                        padding: '8px 14px',
                        borderRadius: RADIUS.md,
                        border: '1px solid rgba(0,0,0,0.08)',
                        background: '#f8fafc',
                        color: COLORS.charcoalBlue,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      disabled={uploadingAvatar}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Camera size={14} />
                      {uploadingAvatar ? `${Math.round(uploadProgress)}%` : t('settings:avatarUpload')}
                    </Motion.button>
                    <span style={{ fontSize: '0.78rem', color: COLORS.textSecondary }}>
                      {t('settings:avatarHint')}
                    </span>
                  </div>

                  {/* Name + Photo URL fields */}
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: COLORS.textSecondary }}>
                        {t('settings:travelerName')}
                      </label>
                      <input
                        style={{
                          padding: '10px 14px',
                          borderRadius: RADIUS.md,
                          border: '1px solid rgba(0,0,0,0.08)',
                          fontSize: '0.92rem',
                          outline: 'none',
                          fontFamily: FONTS.body,
                          color: COLORS.charcoalBlue,
                          background: '#f8fafc',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        onBlur={handleSaveOnBlur}
                        placeholder={t('settings:travelerName')}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: COLORS.textSecondary }}>
                        {t('settings:photoUrl')}
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          style={{
                            padding: '10px 14px',
                            borderRadius: RADIUS.md,
                            border: '1px solid rgba(0,0,0,0.08)',
                            fontSize: '0.92rem',
                            outline: 'none',
                            fontFamily: FONTS.body,
                            color: COLORS.charcoalBlue,
                            background: '#f8fafc',
                            width: '100%',
                            boxSizing: 'border-box',
                            flex: 1,
                          }}
                          value={photoUrl}
                          onChange={e => { setPhotoUrl(e.target.value); setPhotoError(false); }}
                          onBlur={handleSaveOnBlur}
                          placeholder="https://..."
                        />
                        <Camera size={16} color={COLORS.textSecondary} />
                      </div>
                    </div>

                    {savedMsg && (
                      <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          color: COLORS.mutedTeal, fontWeight: 700, fontSize: '0.83rem',
                        }}
                      >
                        <CheckCircle size={14} /> {savedMsg}
                      </Motion.div>
                    )}
                  </div>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </GroupCard>
      </Motion.div>

      {/* ── Preferences Group ── */}
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.05 }}
      >
        <SectionHeader>{t('settings:language.title', 'Preferences')}</SectionHeader>
        <GroupCard>
          <SettingsRow
            icon={Globe}
            label={t('settings:language.title')}
            description={t('settings:language.description')}
            onClick={() => {}}
            trailing={
              <LanguageToggle
                currentLang={i18n.language}
                onToggle={(code) => i18n.changeLanguage(code)}
              />
            }
            isLast={true}
          />
        </GroupCard>
      </Motion.div>

      {/* ── Operational Controls (Admin Only) ── */}
      {canManageOperationalFlags && (
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.08 }}
        >
          <OperationalControlsSection
            canManageOperationalFlags={canManageOperationalFlags}
            currentUser={user}
            onNotify={pushToast}
          />
        </Motion.div>
      )}

      {/* ── Account Group ── */}
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.1 }}
      >
        <SectionHeader>{t('settings:accountTitle', 'Account')}</SectionHeader>
        <GroupCard style={{ border: '1px solid rgba(239, 68, 68, 0.12)' }}>
          <SettingsRow
            icon={LogOut}
            label={t('common:logout')}
            description={t('settings:logoutDescription')}
            onClick={logout}
            danger
          />
          <SettingsRow
            icon={Trash2}
            label={t('settings:deleteAccount')}
            description={t('settings:deleteAccountMessage')}
            onClick={() => setShowDeleteConfirm(true)}
            danger
            isLast={true}
          />
        </GroupCard>
      </Motion.div>

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
    </div>
  );
};

export default SettingsPage;
