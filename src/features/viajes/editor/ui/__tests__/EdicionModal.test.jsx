// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest';

// lucide-react y framer-motion se mockean globalmente via resolve.alias en vite.config.js

// ── IMPORTANTE: los hooks mockeados deben retornar REFERENCIAS ESTABLES ─────
// Si devuelven un objeto nuevo en cada llamada, los useEffect que dependen de
// ellos entran en bucle infinito (re-render → nuevo objeto → efecto → setState
// → re-render → ...) y el proceso OOM-ea.

const mockUsuario = { uid: 'u1' };
const mockAuthReturn = { usuario: mockUsuario };
vi.mock('../../../../../context/AuthContext', () => ({ useAuth: () => mockAuthReturn }));

const mockPushToast = vi.fn();
const mockToastReturn = { pushToast: mockPushToast };
vi.mock('../../../../../context/ToastContext', () => ({ useToast: () => mockToastReturn }));

const mockWindowSize = { isMobile: false };
vi.mock('../../../../../hooks/useWindowSize', () => ({ useWindowSize: () => mockWindowSize }));

const mockGaleria = { fotos: [], uploading: false, limpiar: vi.fn(), cambiarPortada: vi.fn(), eliminar: vi.fn(), actualizarCaption: vi.fn() };
vi.mock('../../../../../hooks/useGaleriaViaje', () => ({ useGaleriaViaje: () => mockGaleria }));

vi.mock('../../../../../firebase', () => ({ db: {}, storage: {} }));

const mockUpload = { iniciarSubida: vi.fn(), getEstadoViaje: () => ({}) };
vi.mock('../../../../../context/UploadContext', () => ({ useUpload: () => mockUpload }));

vi.mock('../../../../../features/invitations/api/invitationsService', () => ({ createInvitation: vi.fn() }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(async () => ({ docs: [] })),
  query: vi.fn(),
  where: vi.fn(),
}));

import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import EdicionModal from '../EdicionModal';

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

describe('EdicionModal (borrador)', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onSave: vi.fn(async () => 'newId'),
    isSaving: false
  };

  test('genera título automático para borrador con ciudad inicial y no muestra galería del servidor', async () => {
    const viaje = {
      id: 'new',
      nombreEspanol: 'España',
      titulo: '',
      fechaInicio: '2024-01-01',
      fechaFin: '2024-01-02',
      foto: null,
      flag: null
    };

    const ciudadInicial = { nombre: 'Barcelona', coordenadas: [2.17, 41.38], paisCodigo: 'ESP' };

    render(<EdicionModal viaje={viaje} esBorrador={true} ciudadInicial={ciudadInicial} {...defaultProps} />);

    // Esperar que el input del título tenga el título generado
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/tripTitlePlaceholder/i);
      expect(input).toHaveValue('Escapada a Barcelona');
    });

    // La galería del servidor no debe mostrarse para borradores
    expect(screen.queryByText(/labels\.portada/)).not.toBeInTheDocument();
  });

  test('cambiar a Manual al tipear en el título', async () => {
    const user = userEvent.setup();
    const viaje = { id: 'new', nombreEspanol: 'Chile', titulo: '', fechaInicio: '2024-01-01', fechaFin: '2024-01-02' };
    render(<EdicionModal viaje={viaje} esBorrador={true} {...defaultProps} />);

    const input = await screen.findByPlaceholderText(/tripTitlePlaceholder/i);
    // al inicio debe estar en Auto (badge)
    expect(screen.getByRole('button', { name: /autoTitle|manualTitle/ })).toHaveTextContent('autoTitle');

    // Limpiar y escribir manualmente
    await user.clear(input);
    await user.type(input, 'X');

    // Badge debe indicar Manual (el nombre accesible viene del texto, no del title)
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /manualTitle/i });
      expect(btn).toHaveTextContent('manualTitle');
      expect(btn).toHaveAttribute('title', expect.stringMatching(/tooltip\.manualMode/i));
    });
  });

  test('al crear viaje con fotos de galeria inicia subida en background con el viajeId guardado', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => 'viaje-nuevo-123');
    const onClose = vi.fn();

    const viaje = {
      id: 'new',
      nombreEspanol: 'Argentina',
      titulo: '',
      fechaInicio: '2024-02-01',
      fechaFin: '2024-02-02',
      foto: null,
      flag: null,
    };

    const { container } = render(
      <EdicionModal
        viaje={viaje}
        esBorrador={true}
        onClose={onClose}
        onSave={onSave}
        isSaving={false}
      />
    );

    const galleryInput = container.querySelector('input[type="file"][multiple]');
    expect(galleryInput).not.toBeNull();

    const foto = new File(['fake image'], 'foto.jpg', { type: 'image/jpeg' });
    await user.upload(galleryInput, foto);

    const saveBtn = screen
      .getAllByRole('button')
      .find((btn) => /button\.createTrip/i.test(btn.textContent || ''));
    expect(saveBtn).toBeTruthy();
    saveBtn.click();

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(mockUpload.iniciarSubida).toHaveBeenCalledTimes(1);
      expect(mockUpload.iniciarSubida).toHaveBeenCalledWith(
        'viaje-nuevo-123',
        expect.arrayContaining([expect.any(File)]),
        0
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('re-inicializa borrador cuando cambia el pais seleccionado con id new y permite guardar', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => 'new-id');

    const { rerender } = render(
      <EdicionModal
        viaje={{ id: 'new', nombreEspanol: 'Chile', code: 'CL', titulo: '', fechaInicio: '2024-03-01', fechaFin: '2024-03-02' }}
        esBorrador={true}
        onClose={vi.fn()}
        onSave={onSave}
        isSaving={false}
      />
    );

    const saveBtn1 = screen
      .getAllByRole('button')
      .find((btn) => /button\.createTrip/i.test(btn.textContent || ''));
    expect(saveBtn1).toBeTruthy();
    saveBtn1.click();

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenNthCalledWith(
        1,
        'new',
        expect.objectContaining({ nombreEspanol: 'Chile', code: 'CL' })
      );
    });

    rerender(
      <EdicionModal
        viaje={{ id: 'new', nombreEspanol: 'Argentina', code: 'AR', titulo: '', fechaInicio: '2024-04-01', fechaFin: '2024-04-03' }}
        esBorrador={true}
        onClose={vi.fn()}
        onSave={onSave}
        isSaving={false}
      />
    );

    const saveBtn2 = screen
      .getAllByRole('button')
      .find((btn) => /button\.createTrip/i.test(btn.textContent || ''));
    expect(saveBtn2).toBeTruthy();
    saveBtn2.click();

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(2);
      expect(onSave).toHaveBeenNthCalledWith(
        2,
        'new',
        expect.objectContaining({ nombreEspanol: 'Argentina', code: 'AR' })
      );
    });

    await user.click(document.body);
  });

  test('borrador de pais (sin ciudad inicial) permite crear viaje', async () => {
    const onSave = vi.fn(async () => 'pais-new-id');

    render(
      <EdicionModal
        viaje={{
          id: 'new',
          nombreEspanol: 'Argentina',
          code: 'AR',
          titulo: '',
          fechaInicio: '2024-05-01',
          fechaFin: '2024-05-02',
          latlng: [0, 0],
          coordenadas: [0, 0],
        }}
        esBorrador={true}
        onClose={vi.fn()}
        onSave={onSave}
        isSaving={false}
      />
    );

    const createBtn = screen
      .getAllByRole('button')
      .find((btn) => /button\.createTrip/i.test(btn.textContent || ''));
    expect(createBtn).toBeTruthy();
    createBtn.click();

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        'new',
        expect.objectContaining({
          nombreEspanol: 'Argentina',
          code: 'AR',
          latlng: [0, 0],
        })
      );
    });
  });
});

// Tests de companion autocomplete e invitaciones se cubren vía E2E (e2e/invitations.spec.ts)
// ya que requieren integración profunda con firebase/firestore que no es viable mockear unitariamente.
