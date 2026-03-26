/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock the hook used by the component
vi.mock('../../model/useInvitations', () => {
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

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock AuthContext and ToastContext used by the component
vi.mock('@app/providers/AuthContext', () => ({ useAuth: () => ({ usuario: { uid: 'user123', email: 'a@b.com' } }) }));
const pushToastMock = vi.fn();
vi.mock('@app/providers/ToastContext', () => ({
  useToast: () => ({ pushToast: pushToastMock })
}));



describe('InvitationsList', () => {
  it('muestra invitaciones y dispara aceptar/rechazar y abre editor al aceptar', async () => {
    // ensure module cache is clean so the hoisted mock is used
    vi.resetModules();
    const { default: InvitationsList } = await import('../InvitationsList');

    // inject a fake hook to avoid importing the real module
    const accept = vi.fn().mockResolvedValue(true);
    const decline = vi.fn().mockResolvedValue(true);
    const fakeHook = () => ({ invitations: [{ id: 'inv1', inviterId: 'userA', viajeId: 'viaje-1', status: 'pending' }], acceptInvitation: accept, declineInvitation: decline });

    render(
      <MemoryRouter>
        <InvitationsList hook={fakeHook()} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('inv-card-inv1')).toBeTruthy();
    expect(screen.getByText('userA')).toBeTruthy();
    expect(screen.getByText('viaje-1')).toBeTruthy();

    await userEvent.click(screen.getByTestId('inv-accept-inv1'));
    expect(accept).toHaveBeenCalledWith('inv1');
    expect(pushToastMock).toHaveBeenCalledWith(expect.stringContaining('Invitación aceptada'), 'success');
    expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/trips', search: 'editing=viaje-1' });

    await userEvent.click(screen.getByTestId('inv-decline-inv1'));
    expect(decline).toHaveBeenCalledWith('inv1');
    expect(pushToastMock).toHaveBeenCalledWith(expect.stringContaining('Invitación rechazada'), 'warning');
  });
});
