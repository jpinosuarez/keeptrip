import React, { useState } from 'react';
import { Save, User, Camera, LogOut, Globe } from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext';
import { COLORS, SHADOWS, RADIUS, FONTS } from '@shared/config';
import { useTranslation } from 'react-i18next';

const SettingsPage = () => {
  const { usuario, actualizarPerfilUsuario, logout, isAdmin } = useAuth();
  const { t, i18n } = useTranslation(['settings', 'common']);
  const [nombre, setNombre] = useState(usuario?.displayName || '');
  const [foto, setFoto] = useState(usuario?.photoURL || '');
  const [msg, setMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg(t('settings:saving'));
    const exito = await actualizarPerfilUsuario(nombre, foto);
    setMsg(exito ? t('settings:toast.success') : t('settings:toast.error'));
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <h1 style={styles.title}>{t('settings:accountTitle')}</h1>
        <div style={styles.badgeGroup}>
          {usuario?.email && (
            <span style={styles.emailBadge}>{usuario.email}</span>
          )}
          <span style={styles.adminBadge(isAdmin)}>
            {isAdmin ? t('settings:admin') : t('settings:user')}
          </span>
        </div>
      </div>
      
      <div style={styles.card}>
        <div style={styles.section}>
          <h2 style={styles.subtitle}>{t('settings:publicProfile')}</h2>
          
          <div style={styles.avatarSection}>
            <div style={styles.avatar}>
              <img src={foto || 'https://via.placeholder.com/150'} alt="Avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} />
            </div>
            <div style={{flex:1}}>
              <label style={styles.label}>{t('settings:photoUrl')}</label>
              <div style={{display:'flex', gap:'10px'}}>
                <input 
                  style={styles.input} 
                  value={foto} 
                  onChange={e => setFoto(e.target.value)} 
                  placeholder={t('settings:urlPlaceholder')} 
                />
              </div>
              <p style={styles.helper}>{t('settings:photoUrlHelper')}</p>
            </div>
          </div>

          <label style={styles.label}>{t('settings:travelerName')}</label>
          <input 
            style={styles.input} 
            value={nombre} 
            onChange={e => setNombre(e.target.value)} 
          />
        </div>

        <div style={styles.actions}>
          <button onClick={handleSave} style={styles.saveBtn}>
            <Save size={18} /> {t('common:saveChanges')}
          </button>
          {msg && <span style={styles.msg}>{msg}</span>}
        </div>
      </div>

      <div style={{...styles.card, marginTop:'30px', borderColor: '#fee2e2'}}>
        <h2 style={{...styles.subtitle, color: COLORS.danger}}>{t('settings:dangerZone')}</h2>
        <p style={{marginBottom:'20px', color:COLORS.textSecondary}}>{t('settings:logoutDescription')}</p>
        <button onClick={logout} style={styles.logoutBtn}>
          <LogOut size={18} /> {t('common:logout')}
        </button>
      </div>

      {/* Language Selector */}
      <div style={{...styles.card, marginTop:'30px'}}>
        <h2 style={styles.subtitle}><Globe size={18} style={{marginRight:'8px', verticalAlign:'middle'}} />{t('settings:language.title')}</h2>
        <p style={{marginBottom:'16px', color:COLORS.textSecondary}}>{t('settings:language.description')}</p>
        <div style={{display:'flex', gap:'12px'}}>
          {[{ code: 'es', label: '🇪🇸 Español' }, { code: 'en', label: '🇺🇸 English' }].map(lang => {
            const isActive = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => i18n.changeLanguage(lang.code)}
                style={{
                  padding: '10px 20px',
                  borderRadius: RADIUS.md,
                  border: isActive ? `2px solid ${COLORS.atomicTangerine}` : `1px solid ${COLORS.border}`,
                  background: isActive ? '#fff7ed' : COLORS.surface,
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  color: isActive ? COLORS.charcoalBlue : COLORS.textSecondary,
                  transition: 'all 0.2s ease',
                }}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: FONTS.heading },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
  badgeGroup: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  title: { fontSize: '2.5rem', fontWeight: '900', color: COLORS.charcoalBlue, marginBottom: '30px' },
  emailBadge: {
    padding: '8px 14px',
    borderRadius: RADIUS.full,
    fontSize: '0.78rem',
    fontWeight: '700',
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: '#475569'
  },
  adminBadge: (isAdmin) => ({
    padding: '8px 14px',
    borderRadius: RADIUS.full,
    fontSize: '0.8rem',
    fontWeight: '800',
    border: `1px solid ${isAdmin ? '#fde68a' : COLORS.border}`,
    background: isAdmin ? '#fff7ed' : COLORS.background,
    color: isAdmin ? '#c2410c' : COLORS.textSecondary
  }),
  card: { background: COLORS.surface, padding: '40px', borderRadius: RADIUS.xl, boxShadow: SHADOWS.md, border: `1px solid ${COLORS.background}` },
  subtitle: { fontSize: '1.2rem', fontWeight: '800', color: COLORS.charcoalBlue, marginBottom: '20px', borderBottom:`2px solid ${COLORS.background}`, paddingBottom:'10px' },
  section: { display: 'flex', flexDirection: 'column', gap: '20px' },
  avatarSection: { display: 'flex', gap: '30px', alignItems: 'center', marginBottom: '20px' },
  avatar: { width: '100px', height: '100px', borderRadius: RADIUS.full, overflow: 'hidden', border: `4px solid ${COLORS.linen}` },
  label: { fontSize: '0.9rem', fontWeight: '700', color: COLORS.textSecondary, marginBottom: '8px', display: 'block' },
  input: { width: '100%', padding: '14px', borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}`, fontSize: '1rem', outline: 'none' },
  helper: { fontSize: '0.8rem', color: COLORS.textSecondary, marginTop: '6px' },
  actions: { marginTop: '30px', display: 'flex', alignItems: 'center', gap: '20px' },
  saveBtn: { background: COLORS.atomicTangerine, color: COLORS.surface, padding: '14px 28px', borderRadius: RADIUS.md, border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontSize:'1rem' },
  logoutBtn: { background: COLORS.surface, border: '2px solid #fee2e2', color: COLORS.danger, padding: '12px 24px', borderRadius: RADIUS.md, fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' },
  msg: { color: COLORS.mutedTeal, fontWeight: '700' }
};

export default SettingsPage;