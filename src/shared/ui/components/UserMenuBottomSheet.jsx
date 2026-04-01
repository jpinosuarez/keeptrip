import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BottomSheet from './BottomSheet';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';

const UserMenuBottomSheet = () => {
  const { t } = useTranslation(['common', 'settings']);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { userMenuOpen, closeUserMenu } = useUI();

  const handleLogout = async () => {
    closeUserMenu();
    await logout();
  };

  const handleSettings = () => {
    closeUserMenu();
    navigate('/settings');
  };

  return (
    <BottomSheet isOpen={userMenuOpen} onClose={closeUserMenu} ariaLabel="User menu"> 
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px 20px',
        }}
      >
        <button
          type="button"
          onClick={handleSettings}
          style={styles.button}
        >
          <Settings size={18} />
          <span style={styles.label}>{t('settings:settings', 'Ajustes')}</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          style={styles.button}
        >
          <LogOut size={18} />
          <span style={styles.label}>{t('common:logout', 'Cerrar Sesión')}</span>
        </button>
      </div>
    </BottomSheet>
  );
};

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid rgba(0,0,0,0.08)',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1F2937',
  },
  label: {
    flex: 1,
    textAlign: 'left',
  },
};

export default UserMenuBottomSheet;
