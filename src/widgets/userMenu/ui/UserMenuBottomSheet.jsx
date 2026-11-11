/**
 * UserMenuBottomSheet — 2026 Contextual Profile Menu
 * 
 * Standardizes the mobile profile actions within a premium glass container.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Compass, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@shared/ui/components/BottomSheet';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { ENABLE_TRAVEL_STATS } from '@shared/config';
import { setDevMenuOpen } from '@shared/dev/devMenuState';
import { cn } from '@shared/lib/utils/cn';

const UserMenuBottomSheet = () => {
  const { t } = useTranslation(['common', 'settings', 'landing']);
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

  const handleStats = () => {
    closeUserMenu();
    navigate('/hub');
  };

  const handleDevPanel = () => {
    closeUserMenu();
    setDevMenuOpen(true);
  };

  return (
    <BottomSheet isOpen={userMenuOpen} onClose={closeUserMenu} ariaLabel="User menu"> 
      <div className="flex flex-col gap-3 p-5">
        {ENABLE_TRAVEL_STATS && (
          <button
            type="button"
            onClick={handleStats}
            className={cn(
              "flex items-center gap-3 w-full min-h-[44px] px-4 py-3.5 rounded-xl",
              "border border-black/5 bg-white cursor-pointer text-base font-bold text-slate-800",
              "text-left hover:bg-black/5 transition-all duration-200 font-heading"
            )}
          >
            <Compass size={18} className="text-atomicTangerine" />
            <span className="flex-1">{t('nav:progress', 'Progreso')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleSettings}
          className={cn(
            "flex items-center gap-3 w-full min-h-[44px] px-4 py-3.5 rounded-xl",
            "border border-black/5 bg-white cursor-pointer text-base font-bold text-slate-800",
            "text-left hover:bg-black/5 transition-all duration-200 font-heading"
          )}
        >
          <Settings size={18} className="text-text-secondary" />
          <span className="flex-1">{t('settings:settings', 'Ajustes')}</span>
        </button>

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={handleDevPanel}
            className={cn(
              "flex items-center gap-3 w-full min-h-[44px] px-4 py-3.5 rounded-xl",
              "border border-dashed border-black/15 bg-white cursor-pointer text-base font-bold text-slate-800",
              "text-left hover:bg-black/5 transition-all duration-200 font-heading"
            )}
            data-testid="user-menu-dev-panel"
          >
            <Wrench size={18} className="text-text-secondary" />
            <span className="flex-1">{t('landing:devDock.panel.title', 'Panel Desarrollador')}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-[0.62rem] font-extrabold tracking-wider">
              DEV
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full min-h-[44px] px-4 py-3.5 rounded-xl",
            "border border-black/5 bg-white cursor-pointer text-base font-bold text-danger",
            "text-left hover:bg-danger/5 transition-all duration-200 font-heading"
          )}
        >
          <LogOut size={18} />
          <span className="flex-1">{t('common:logout', 'Cerrar Sesión')}</span>
        </button>
      </div>
    </BottomSheet>
  );
};

export default UserMenuBottomSheet;
