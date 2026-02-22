// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest';

// lucide-react y framer-motion se mockean globalmente via resolve.alias en vite.config.js

// ── IMPORTANTE: los hooks mockeados deben retornar REFERENCIAS ESTABLES ─────
// Si devuelven un objeto nuevo en cada llamada, los useEffect que dependen de
// ellos entran en bucle infinito (re-render → nuevo objeto → efecto → setState
// → re-render → ...) y el proceso OOM-ea.

const mockUsuario = { uid: 'u1' };
const mockAuthReturn = { usuario: mockUsuario };
vi.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuthReturn }));

const mockPushToast = vi.fn();
const mockToastReturn = { pushToast: mockPushToast };
vi.mock('../../context/ToastContext', () => ({ useToast: () => mockToastReturn }));

const mockWindowSize = { isMobile: false };
vi.mock('../../hooks/useWindowSize', () => ({ useWindowSize: () => mockWindowSize }));

const mockGaleria = { fotos: [], uploading: false, limpiar: vi.fn(), cambiarPortada: vi.fn(), eliminar: vi.fn(), actualizarCaption: vi.fn() };
vi.mock('../../hooks/useGaleriaViaje', () => ({ useGaleriaViaje: () => mockGaleria }));

vi.mock('../../firebase', () => ({ db: {}, storage: {} }));

const mockUpload = { iniciarSubida: vi.fn(), getEstadoViaje: () => ({}) };
vi.mock('../../context/UploadContext', () => ({ useUpload: () => mockUpload }));

vi.mock('../../services/invitationsService', () => ({ createInvitation: vi.fn() }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(async () => ({ docs: [] })),
  query: vi.fn(),
  where: vi.fn(),
}));

import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';
import EdicionModal from './EdicionModal';

afterEach(() => cleanup());

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
      const input = screen.getByPlaceholderText(/Título del viaje/i);
      expect(input).toHaveValue('Escapada a Barcelona');
    });

    // La galería del servidor no debe mostrarse para borradores
    expect(screen.queryByText(/Portada/)).not.toBeInTheDocument();
  });

  test('cambiar a Manual al tipear en el título', async () => {
    const viaje = { id: 'new', nombreEspanol: 'Chile', titulo: '', fechaInicio: '2024-01-01', fechaFin: '2024-01-02' };
    render(<EdicionModal viaje={viaje} esBorrador={true} {...defaultProps} />);

    const input = await screen.findByPlaceholderText(/Título del viaje/i);
    // al inicio debe estar en Auto (badge)
    expect(screen.getByRole('button', { name: /Auto|Manual/ })).toHaveTextContent('Auto');

    await userEvent.type(input, 'Mi título manual');

    // Badge debe indicar Manual (el nombre accesible viene del texto, no del title)
    const btn = screen.getByRole('button', { name: /Manual/i });
    expect(btn).toHaveTextContent('Manual');
    expect(btn).toHaveAttribute('title', expect.stringMatching(/Usando título manual/i));
  });
});

// Tests de companion autocomplete e invitaciones se cubren vía E2E (e2e/invitations.spec.ts)
// ya que requieren integración profunda con firebase/firestore que no es viable mockear unitariamente.
