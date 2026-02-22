/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

// Mock the hook used by the component
vi.mock('../../../hooks/useInvitations', () => {
  const accept = vi.fn().mockResolvedValue(true);
  const decline = vi.fn().mockResolvedValue(true);
  return {
    __esModule: true,
    default: () => ({
      invitations: [{ id: 'inv1', inviterId: 'userA', viajeId: 'viaje-1', status: 'pending' }],
      acceptInvitation: accept,
      declineInvitation: decline
    }),
    accept,
    decline
  };
});

// Mock AuthContext, UIContext and ToastContext used by the component
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ usuario: { uid: 'user123', email: 'a@b.com' } }) }));
const abrirVisorMock = vi.fn();
const setVistaActivaMock = vi.fn();
vi.mock('../../../context/UIContext', () => ({
  useUI: () => ({ abrirVisor: abrirVisorMock, setVistaActiva: setVistaActivaMock })
}));
const pushToastMock = vi.fn();
vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ pushToast: pushToastMock })
}));



describe('InvitationsList', () => {
  it('muestra invitaciones y dispara aceptar/rechazar y abre el visor al aceptar', async () => {
    const ui = { abrirVisor: abrirVisorMock, setVistaActiva: setVistaActivaMock };
    const toast = { pushToast: pushToastMock };

    // ensure module cache is clean so the hoisted mock is used
    vi.resetModules();
    const { default: InvitationsList } = await import('../InvitationsList');

    // inject a fake hook to avoid importing the real module
    const accept = vi.fn().mockResolvedValue(true);
    const decline = vi.fn().mockResolvedValue(true);
    const fakeHook = () => ({ invitations: [{ id: 'inv1', inviterId: 'userA', viajeId: 'viaje-1', status: 'pending' }], acceptInvitation: accept, declineInvitation: decline });

    render(<InvitationsList hook={fakeHook()} />);

    expect(screen.getByTestId('inv-card-inv1')).toBeTruthy();
    expect(screen.getByText('userA')).toBeTruthy();
    expect(screen.getByText('viaje-1')).toBeTruthy();

    await userEvent.click(screen.getByTestId('inv-accept-inv1'));
    expect(accept).toHaveBeenCalledWith('inv1');
    expect(pushToastMock).toHaveBeenCalledWith(expect.stringContaining('Invitación aceptada'), 'success');
    expect(setVistaActivaMock).toHaveBeenCalledWith('bitacora');
    expect(abrirVisorMock).toHaveBeenCalledWith('viaje-1');

    await userEvent.click(screen.getByTestId('inv-decline-inv1'));
    expect(decline).toHaveBeenCalledWith('inv1');
    expect(pushToastMock).toHaveBeenCalledWith(expect.stringContaining('Invitación rechazada'), 'warning');
  });
});
