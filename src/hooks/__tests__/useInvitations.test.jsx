/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import useInvitations from '../useInvitations';
import * as invitationsService from '../../services/invitationsService';
import * as AuthModule from '../../context/AuthContext';

vi.mock('../../services/invitationsService');

describe('useInvitations (integration via component)', () => {
  const fakeInv = [{ id: 'inv1', status: 'pending', inviterId: 'u1', viajeId: 'v1' }];

  beforeEach(() => {
    invitationsService.listenToInvitationsForUser.mockImplementation((uid, cb) => {
      cb(fakeInv);
      return () => {};
    });
    invitationsService.acceptInvitation.mockResolvedValue(true);
    invitationsService.declineInvitation = vi.fn().mockResolvedValue(true);
  });

  function TestComp() {
    const { invitations, acceptInvitation, declineInvitation } = useInvitations();
    return (
      <div>
        <div data-testid="count">{invitations.length}</div>
        <button onClick={() => acceptInvitation('inv1')}>Aceptar</button>
        <button onClick={() => declineInvitation('inv1')}>Rechazar</button>
      </div>
    );
  }

  test('subscribes and exposes accept/decline', async () => {
    // mock useAuth para inyectar usuario
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({ usuario: { uid: 'user123', email: 'a@b.com' } });

    render(<TestComp />);

    expect(screen.getByTestId('count').textContent).toBe('1');

    await userEvent.click(screen.getByText('Aceptar'));
    await waitFor(() => expect(invitationsService.acceptInvitation).toHaveBeenCalledWith({ db: null, invitationId: 'inv1', acceptorUid: 'user123' }));

    await userEvent.click(screen.getByText('Rechazar'));
    await waitFor(() => expect(invitationsService.declineInvitation).toHaveBeenCalled());
  });
});
