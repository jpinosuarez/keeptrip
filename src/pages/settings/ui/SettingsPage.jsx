/**
 * SettingsPage — 2026 Bento Layout (Iteration 11)
 *
 * Architecture:
 *   - Migrated from pages/Configuracion → pages/settings (FSD English-only rule)
 *   - Auto-save on blur with debounce (Guardrail #4)
 *   - mapStyle preference wired to UIContext (Guardrail #2)
 *   - JSON data export
 *   - Live avatar preview (URL → instant preview, no save required to see)
 */
import React, { useState, useCallback, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import {
  User, Globe, Moon, Download, LogOut, ChevronRight,
  CheckCircle, Map, Layers, Compass, Camera, Pencil, Trash2
} from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { useToast } from '@app/providers/ToastContext';
import { COLORS, SHADOWS, RADIUS, FONTS } from '@shared/config';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { auth, storage } from '@shared/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';
import { compressImage } from '@shared/lib/utils/imageUtils';

const DEBOUNCE_MS = 800;

const SettingsPage = ({ log = [] }) => {
  const { usuario, actualizarPerfilUsuario, logout, isAdmin } = useAuth();
  const { mapStyle, setMapStyle, MAP_STYLES } = useUI();
  const { pushToast } = useToast();
  const { t, i18n } = useTranslation(['settings', 'common', 'nav']);
  const { t: tNav } = useTranslation('nav');
  useDocumentTitle(tNav('settings'));

  const [nombre, setNombre] = useState(usuario?.displayName || '');
  const [foto, setFoto]    = useState(usuario?.photoURL || '');
  const [savedMsg, setSavedMsg] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const debounceRef = useRef(null);

  // Auto-save on blur (Guardrail #4)
  const handleSaveOnBlur = useCallback(async () => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (nombre === (usuario?.displayName || '') && foto === (usuario?.photoURL || '')) return;
      const ok = await actualizarPerfilUsuario(nombre, foto);
      setSavedMsg(ok ? t('settings:toast.success') : t('settings:toast.error'));
      setTimeout(() => setSavedMsg(''), 2500);
    }, DEBOUNCE_MS);
  }, [nombre, foto, usuario, actualizarPerfilUsuario, t]);

  const fileInputRef = useRef(null);

  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setUploadProgress(0);

    try {
      const { blob } = await compressImage(file, 1024, 0.8, (progress) => {
        setUploadProgress(progress);
      });

      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('No authenticated user');
      const avatarRef = ref(storage, `usuarios/${userId}/avatars/avatar.jpg`);
      await uploadBytes(avatarRef, blob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(avatarRef);

      setFoto(url);
      await actualizarPerfilUsuario(nombre, url);
      pushToast(t('settings:avatarUploadSuccess', 'Avatar updated!'), 'success');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      pushToast(t('settings:avatarUploadError', 'Failed to upload avatar. Please try again.'), 'error');
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
      pushToast(t('settings:deleteAccountSuccess', 'Your account has been deleted.'), 'success');
      logout();
    } catch (error) {
      console.error('Delete account failed:', error);
      if (error?.code === 'auth/requires-recent-login') {
        pushToast(
          t('settings:deleteAccountNeedsRelogin', 'Please log out and log back in to delete your account.'),
          'error'
        );
      } else {
        pushToast(t('settings:deleteAccountError', 'Could not delete account. Please try again.'), 'error');
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  // Data Export — JSON download
  const handleExport = () => {
    const data = JSON.stringify(log, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `keeptrip-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MAP_STYLE_OPTIONS = [
    { id: 'globe',  icon: Globe,    label: t('settings:mapStyle.globe'),  desc: t('settings:mapStyle.globeDesc', '3D Interactive Globe') },
    { id: 'flat',   icon: Map,      label: t('settings:mapStyle.flat'),   desc: t('settings:mapStyle.flatDesc',  'Classic Flat Map') },
    { id: 'hybrid', icon: Layers,   label: t('settings:mapStyle.hybrid'), desc: t('settings:mapStyle.hybridDesc','Satellite Hybrid') },
  ];

  const initials = usuario?.displayName?.trim()?.[0]?.toUpperCase() || '';

  return (
    <div style={s.page(isMobile)}>

      {/* ── Identity Card ── */}
      <Motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120 }}
        style={s.card}
      >
        <div style={s.identityRow}>
          {/* Avatar */}
          <div style={s.avatarWrap}>
            {foto && !photoError ? (
              <img
                src={foto}
                alt="Avatar"
                style={s.avatarImg}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div style={s.avatarFallback}>{initials || <User size={32} />}</div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.nameRow}>
              <h1 style={s.displayName}>{usuario?.displayName || '—'}</h1>
              <Motion.button
                type="button"
                onClick={() => setEditingProfile(v => !v)}
                whileTap={{ scale: 0.94 }}
                style={s.editBtn}
                aria-label="Edit profile"
              >
                <Pencil size={14} />
              </Motion.button>
            </div>
            <div style={s.badgeRow}>
              {usuario?.email && <span style={s.emailBadge}>{usuario.email}</span>}
              <span style={s.roleBadge(isAdmin)}>{isAdmin ? t('settings:admin') : t('settings:user')}</span>
            </div>

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
                  <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFileChange}
                    />
                    <button
                      type="button"
                      onClick={handleAvatarUploadClick}
                      style={s.uploadBtn}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? `${Math.round(uploadProgress)}%` : t('settings:uploadAvatar', 'Upload avatar')}
                    </button>
                    <span style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>
                      {t('settings:avatarHint', 'Max 2MB, JPG/PNG')}
                    </span>
                  </div>

                  <div style={s.editForm}>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>{t('settings:travelerName')}</label>
                      <input
                        style={s.input}
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        onBlur={handleSaveOnBlur}
                        placeholder={t('settings:travelerName')}
                      />
                    </div>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>{t('settings:photoUrl')}</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          style={{ ...s.input, flex: 1 }}
                          value={foto}
                          onChange={e => { setFoto(e.target.value); setPhotoError(false); }}
                          onBlur={handleSaveOnBlur}
                          placeholder="https://..."
                        />
                        <Camera size={18} color={COLORS.textSecondary} />
                      </div>
                    </div>

                    {savedMsg && (
                      <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={s.savedMsg}
                      >
                        <CheckCircle size={14} /> {savedMsg}
                      </Motion.div>
                    )}
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Motion.section>

      {/* ── Two-column row: Language + Appearance ── */}
      <div style={s.twoCol}>
        {/* Language */}
        <Motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.05 }}
          style={s.card}
        >
          <h2 style={s.sectionTitle}><Globe size={16} /> {t('settings:language.title')}</h2>
          <p style={s.sectionDesc}>{t('settings:language.description')}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[{ code: 'es', label: '🇪🇸 Español' }, { code: 'en', label: '🇺🇸 English' }].map(lang => {
              const active = i18n.language === lang.code;
              return (
                <Motion.button
                  key={lang.code}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang.code)}
                  whileTap={{ scale: 0.94 }}
                  style={s.langBtn(active)}
                >
                  {lang.label}
                </Motion.button>
              );
            })}
          </div>
        </Motion.section>

        {/* Appearance (future-ready dark mode toggle) */}
        <Motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.1 }}
          style={s.card}
        >
          <h2 style={s.sectionTitle}><Moon size={16} /> {t('settings:appearance', 'Apariencia')}</h2>
          <p style={s.sectionDesc}>{t('settings:appearanceDesc', 'Modo oscuro próximamente')}</p>
          <div style={{ ...s.comingSoon }}>
            🌙 Dark Mode — Coming Soon
          </div>
        </Motion.section>
      </div>

      {/* ── Map Style Preferences ── */}
      <Motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.15 }}
        style={s.card}
      >
        <h2 style={s.sectionTitle}><Compass size={16} /> {t('settings:mapStyle.title', 'Estilo de Mapa')}</h2>
        <p style={s.sectionDesc}>{t('settings:mapStyle.desc', 'Elige cómo se muestra tu mundo.')}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>{t('settings:mapStyle.comingSoon', 'Coming soon')}</span>
          <span style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>{t('settings:mapStyle.disabledHint', 'Disabled in this preview')}</span>
        </div>
        <div style={s.mapStyleGrid}>
          {MAP_STYLE_OPTIONS.map(({ id, icon: Icon, label, desc }) => {
            const active = mapStyle === id;
            const disabled = true;
            return (
              <Motion.button
                key={id}
                type="button"
                onClick={() => {
                  if (!disabled) setMapStyle(id);
                }}
                whileTap={disabled ? undefined : { scale: 0.96 }}
                style={s.mapStyleBtn(active, disabled)}
                disabled={disabled}
              >
                <Icon size={22} color={active ? COLORS.atomicTangerine : COLORS.textSecondary} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontWeight: '800', fontSize: '0.88rem', color: active ? COLORS.charcoalBlue : COLORS.textSecondary }}>{label}</span>
                <span style={{ fontSize: '0.72rem', color: COLORS.textSecondary }}>{desc}</span>
                {active && <CheckCircle size={14} color={COLORS.atomicTangerine} style={{ position: 'absolute', top: '10px', right: '10px' }} />}
              </Motion.button>
            );
          })}
        </div>
      </Motion.section>

      {/* ── Legacy & Data ── */}
      <Motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.2 }}
        style={s.card}
      >
        <h2 style={s.sectionTitle}><Download size={16} /> {t('settings:legacyData', 'Legado & Datos')}</h2>
        <p style={s.sectionDesc}>{t('settings:legacyDataDesc', 'Tu bitácora es tuya. Descárgala cuando quieras.')}</p>
        <Motion.button
          type="button"
          onClick={handleExport}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          style={s.exportBtn}
        >
          <Download size={16} />
          {t('settings:exportJSON', 'Exportar viajes (JSON)')}
          <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
        </Motion.button>
      </Motion.section>

      {/* ── Danger Zone ── */}
      <Motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.25 }}
        style={{ ...s.card, border: '1px solid #fee2e2' }}
      >
        <h2 style={{ ...s.sectionTitle, color: COLORS.danger }}><LogOut size={16} /> {t('settings:dangerZone')}</h2>
        <p style={s.sectionDesc}>{t('settings:logoutDescription')}</p>
        <Motion.button
          type="button"
          onClick={logout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          style={s.logoutBtn}
        >
          <LogOut size={16} />
          {t('common:logout')}
        </Motion.button>

        <Motion.button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          style={s.deleteAccountBtn}
        >
          <Trash2 size={16} />
          {t('settings:deleteAccount')}
        </Motion.button>

        <ConfirmModal
          isOpen={showDeleteConfirm}
          title={t('settings:deleteAccountTitle', 'Delete account')}
          message={t('settings:deleteAccountMessage', 'This will permanently delete your account and all your data. This action cannot be undone.')}
          confirmText={t('settings:deleteAccountConfirm', 'Delete account')}
          cancelText={t('common:cancel')}
          onConfirm={handleDeleteAccount}
          onClose={() => setShowDeleteConfirm(false)}
          isLoading={isDeletingAccount}
        />
      </Motion.section>
    </div>
  );
};

// ── Styles ──
const s = {
  page: (isMobile) => ({
    width: '100%',
    maxWidth: '860px',
    margin: '0 auto',
    padding: isMobile ? '16px 16px 80px' : '24px 24px 80px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  }),
  card: {
    background: '#fff',
    borderRadius: RADIUS.xl,
    boxShadow: SHADOWS.sm,
    border: '1px solid rgba(0,0,0,0.06)',
    padding: '28px',
    position: 'relative',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },
  identityRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  avatarWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: `3px solid rgba(0,0,0,0.06)`,
    flexShrink: 0,
    background: COLORS.mutedTeal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: {
    color: '#fff',
    fontWeight: '900',
    fontSize: '1.6rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%',
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  displayName: { margin: 0, fontSize: '1.35rem', fontWeight: '900', color: COLORS.charcoalBlue, letterSpacing: '-0.5px' },
  editBtn: {
    background: 'rgba(0,0,0,0.05)',
    border: 'none',
    borderRadius: RADIUS.md,
    width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    color: COLORS.textSecondary,
  },
  badgeRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  emailBadge: {
    padding: '3px 10px', borderRadius: RADIUS.full,
    fontSize: '0.75rem', fontWeight: '700',
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(0,0,0,0.03)',
    color: COLORS.textSecondary,
  },
  roleBadge: (isAdmin) => ({
    padding: '3px 10px', borderRadius: RADIUS.full,
    fontSize: '0.75rem', fontWeight: '800',
    border: `1px solid ${isAdmin ? '#fde68a' : 'rgba(0,0,0,0.08)'}`,
    background: isAdmin ? '#fff7ed' : 'rgba(0,0,0,0.03)',
    color: isAdmin ? '#c2410c' : COLORS.textSecondary,
  }),
  editForm: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', fontWeight: '700', color: COLORS.textSecondary },
  input: {
    padding: '12px 14px',
    borderRadius: RADIUS.md,
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: FONTS.body,
    color: COLORS.charcoalBlue,
    background: '#fafafa',
    width: '100%',
    boxSizing: 'border-box',
  },
  savedMsg: {
    display: 'flex', alignItems: 'center', gap: '6px',
    color: COLORS.mutedTeal, fontWeight: '700', fontSize: '0.85rem',
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    margin: '0 0 6px',
    fontSize: '1rem', fontWeight: '800', color: COLORS.charcoalBlue,
  },
  sectionDesc: { margin: '0 0 16px', fontSize: '0.83rem', color: COLORS.textSecondary },
  langBtn: (active) => ({
    padding: '10px 18px',
    borderRadius: RADIUS.md,
    border: active ? `2px solid ${COLORS.atomicTangerine}` : '1px solid rgba(0,0,0,0.1)',
    background: active ? '#fff7ed' : '#fafafa',
    fontWeight: active ? '800' : '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    color: active ? COLORS.charcoalBlue : COLORS.textSecondary,
    transition: 'all 0.2s',
  }),
  comingSoon: {
    padding: '12px 16px',
    borderRadius: RADIUS.md,
    background: 'rgba(0,0,0,0.03)',
    color: COLORS.textSecondary,
    fontSize: '0.85rem',
    fontWeight: '600',
    border: '1px dashed rgba(0,0,0,0.1)',
  },
  mapStyleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  mapStyleBtn: (active, disabled) => ({
    display: 'flex', flexDirection: 'column', gap: '4px',
    alignItems: 'flex-start',
    padding: '16px',
    borderRadius: RADIUS.xl,
    border: active ? `2px solid ${COLORS.atomicTangerine}` : '1px solid rgba(0,0,0,0.08)',
    background: active ? '#fff7ed' : '#fafafa',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    textAlign: 'left',
    position: 'relative',
    transition: 'all 0.2s',
  }),
  uploadBtn: {
    padding: '10px 14px',
    borderRadius: RADIUS.md,
    border: '1px solid rgba(0,0,0,0.1)',
    background: '#f3f4f6',
    color: COLORS.charcoalBlue,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  deleteAccountBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderRadius: RADIUS.md,
    border: '2px solid rgba(248, 113, 113, 0.8)',
    background: '#fff',
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '12px',
  },
  exportBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 18px',
    borderRadius: RADIUS.xl,
    border: '1px solid rgba(0,0,0,0.08)',
    background: '#fafafa',
    color: COLORS.charcoalBlue,
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'background 0.2s',
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 20px',
    borderRadius: RADIUS.md,
    border: '2px solid #fee2e2',
    background: '#fff',
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
};

export default SettingsPage;
