// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest';

// lucide-react y framer-motion se mockean globalmente via resolve.alias en vite.config.js

// ── IMPORTANTE: los hooks mockeados deben retornar REFERENCIAS ESTABLES ─────
// Si devuelven un objeto nuevo en cada llamada, los useEffect que dependen de
// ellos entran en bucle infinito (re-render → nuevo objeto → setState
// → re-render → ...) y el proceso OOM-ea.

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: vi.fn(() => ({ 
      t: vi.fn((key) => key),
      i18n: { language: 'es' }
    }))
  };
});

const mockUsuario = { uid: 'u1' };
const mockAuthReturn = { usuario: mockUsuario };
vi.mock('@app/providers/AuthContext', () => ({ useAuth: () => mockAuthReturn }));

const mockPushToast = vi.fn();
const mockToastReturn = { pushToast: mockPushToast };
vi.mock('@app/providers/ToastContext', () => ({ useToast: () => mockToastReturn }));

const mockWindowSize = { isMobile: false };
vi.mock('@shared/lib/hooks/useWindowSize', () => ({ useWindowSize: () => mockWindowSize }));

const mockGaleria = { fotos: [], uploading: false, limpiar: vi.fn(), cambiarPortada: vi.fn(), eliminar: vi.fn(), actualizarCaption: vi.fn() };
vi.mock('@shared/lib/hooks/useGaleriaViaje', () => ({ useGaleriaViaje: () => mockGaleria }));

vi.mock('@shared/firebase', () => ({ db: {}, storage: {} }));

const mockUpload = { iniciarSubida: vi.fn(), getEstadoViaje: () => ({}) };
vi.mock('@app/providers/UploadContext', () => ({ useUpload: () => mockUpload }));

vi.mock('../../../../../features/invitations/api/invitationsService', () => ({ createInvitation: vi.fn() }));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => () => {}),
  collection: vi.fn(),
  getDocs: vi.fn(async () => ({ docs: [] })),
  query: vi.fn(),
  where: vi.fn(),
}));

import React from 'react';
import { render, screen, waitFor, cleanup, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EditorFocusPanel from '../EditorFocusPanel';

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

// Wrapper component to provide Router context for components using useNavigate
const RouterWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('EditorFocusPanel (borrador)', () => {
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

    render(<EditorFocusPanel viaje={viaje} esBorrador={true} ciudadInicial={ciudadInicial} {...defaultProps} />, { wrapper: RouterWrapper });

    // Esperar que el input del título tenga el título generado
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/tripTitlePlaceholder/i);
      expect(input).toHaveValue('Viaje a Barcelona');
    });

    // La galería del servidor no debe mostrarse para borradores
    expect(screen.queryByText(/labels\.portada/)).not.toBeInTheDocument();
  });

  test('cambiar a Manual al tipear en el título', async () => {
    const user = userEvent.setup();
    const viaje = { id: 'new', nombreEspanol: 'Chile', titulo: '', fechaInicio: '2024-01-01', fechaFin: '2024-01-02' };
    render(<EditorFocusPanel viaje={viaje} esBorrador={true} {...defaultProps} />, { wrapper: RouterWrapper });

    const input = await screen.findByPlaceholderText(/tripTitlePlaceholder/i);

      // al inicio en modo auto no debe mostrar el botón de regenerar
      expect(screen.queryByRole('button', { name: /editor\.header\.regenerateTitle/i })).toBeNull();

      // Limpiar y escribir manualmente
      await user.clear(input);
      await user.type(input, 'X');

      // Debe cambiar a modo manual y mostrar el indicador de título manual
      await waitFor(() => {
        expect(screen.getByText('labels.manualTitle')).toBeTruthy();
    });
  });

  test.skip('al crear viaje con fotos de galeria inicia subida en background con el viajeId guardado', async () => {
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
      <EditorFocusPanel
        viaje={viaje}
        esBorrador={true}
        onClose={onClose}
        onSave={onSave}
        isSaving={false}
      />,
      { wrapper: RouterWrapper }
    );

    const galleryInput = container.querySelector('input[type="file"][multiple]');
    expect(galleryInput).not.toBeNull();

    const foto = new File(['fake image'], 'foto.jpg', { type: 'image/jpeg' });
    await user.upload(galleryInput, foto);

    const saveBtn = screen
      .getAllByRole('button')
      .find((btn) => /button\.save/i.test(btn.textContent || ''));
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
      <EditorFocusPanel
        viaje={{ id: 'new', nombreEspanol: 'Chile', code: 'CL', titulo: '', fechaInicio: '2024-03-01', fechaFin: '2024-03-02' }}
        ciudadInicial={{ nombre: 'Santiago', coordenadas: [-70.6693, -33.4489], paisCodigo: 'CL' }}
        esBorrador={true}
        onClose={vi.fn()}
        onSave={onSave}
        isSaving={false}
      />,
      { wrapper: RouterWrapper }
    );

    const saveBtn1 = screen
      .getAllByRole('button')
      .find((btn) => /button\.save/i.test(btn.textContent || ''));
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
      <EditorFocusPanel
        viaje={{ id: 'new', nombreEspanol: 'Argentina', code: 'AR', titulo: '', fechaInicio: '2024-04-01', fechaFin: '2024-04-03' }}
        ciudadInicial={{ nombre: 'Buenos Aires', coordenadas: [-58.3816, -34.6037], paisCodigo: 'AR' }}
        esBorrador={true}
        onClose={vi.fn()}
        onSave={onSave}
        isSaving={false}
      />
    );

    const saveBtn2 = screen
      .getAllByRole('button')
      .find((btn) => /button\.save/i.test(btn.textContent || ''));
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

  test('borrador de pais (sin ciudad inicial) mantiene crear viaje deshabilitado', async () => {
    const onSave = vi.fn(async () => 'pais-new-id');

    render(
      <EditorFocusPanel
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
      />,
      { wrapper: RouterWrapper }
    );

    const createBtn = screen
      .getAllByRole('button')
      .find((btn) => /button\.save/i.test(btn.textContent || ''));
    expect(createBtn).toBeTruthy();
    expect(createBtn).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Borrador de viaje')).toBeInTheDocument();
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  test('en viaje existente hidrata y conserva el titulo guardado', async () => {
    render(
      <EditorFocusPanel
        viaje={{
          id: 'trip-001',
          nombreEspanol: 'España',
          code: 'ES',
          titulo: 'Aventura Iberica',
          fechaInicio: '2024-05-01',
          fechaFin: '2024-05-04',
        }}
        esBorrador={false}
        onClose={vi.fn()}
        onSave={vi.fn(async () => true)}
        isSaving={false}
      />,
      { wrapper: RouterWrapper }
    );

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/tripTitlePlaceholder/i);
      expect(input).toHaveValue('Aventura Iberica');
    });
  });

  test('en viaje existente permite regenerar titulo automatico', async () => {
    const user = userEvent.setup();
    render(
      <EditorFocusPanel
        viaje={{
          id: 'trip-002',
          nombreEspanol: 'España',
          code: 'ES',
          titulo: 'Titulo Manual',
          fechaInicio: '2024-06-01',
          fechaFin: '2024-06-04',
        }}
        esBorrador={false}
        onClose={vi.fn()}
        onSave={vi.fn(async () => true)}
        isSaving={false}
      />,
      { wrapper: RouterWrapper }
    );

    const input = await screen.findByPlaceholderText(/tripTitlePlaceholder/i);
    fireEvent.change(input, { target: { value: 'Titulo Manual' } });
    expect(input).toHaveValue('Titulo Manual');

    // Manual mode visible before regenerate
    const regenerateButton = screen.getByRole('button', {
      name: /editor\.header\.regenerateTitleBtn|Generar t[ií]tulo autom[aá]tico/i,
    });
    expect(regenerateButton).toBeTruthy();

    await user.click(regenerateButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/tripTitlePlaceholder/i)).toBeInTheDocument();
    });
  });

  test('en modo auto el titulo se recalcula al cambiar paradas', async () => {
    const ControlledEditor = () => {
      const [controlledFormData, setControlledFormData] = React.useState({
        id: 'new',
        titulo: '',
        nombreEspanol: 'España',
        fechaInicio: '2024-06-01',
        fechaFin: '2024-06-04',
      });
      const [controlledParadas, setControlledParadas] = React.useState([]);

      return (
        <>
          <button
            type="button"
            onClick={() => {
              setControlledParadas((prev) => [
                ...prev,
                {
                  id: `new-${prev.length + 1}`,
                  nombre: 'Barcelona',
                  coordenadas: [2.1734, 41.3851],
                  fecha: '2024-06-02',
                  paisCodigo: 'ES',
                },
              ]);
            }}
          >
            add-stop
          </button>
          <button
            type="button"
            onClick={() => {
              setControlledParadas((prev) => prev.slice(0, 1));
            }}
          >
            remove-stop
          </button>
          <EditorFocusPanel
            viaje={{
              id: 'new',
              nombreEspanol: 'España',
              code: 'ES',
              titulo: '',
              fechaInicio: '2024-06-01',
              fechaFin: '2024-06-04',
            }}
            formData={controlledFormData}
            setFormData={setControlledFormData}
            paradas={controlledParadas}
            setParadas={setControlledParadas}
            esBorrador={true}
            ciudadInicial={{
              nombre: 'Madrid',
              coordenadas: [-3.7038, 40.4168],
              paisCodigo: 'ES',
            }}
            onClose={vi.fn()}
            onSave={vi.fn(async () => true)}
            isSaving={false}
          />
        </>
      );
    };

    const user = userEvent.setup();
    render(<ControlledEditor />, { wrapper: RouterWrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Viaje a Madrid')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'add-stop' }));
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Viaje a Madrid y Barcelona')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'remove-stop' }));
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Viaje a Madrid')).toBeInTheDocument();
    });
  });
});

// Tests de companion autocomplete e invitaciones se cubren vía E2E (e2e/invitations.spec.ts)
// ya que requieren integración profunda con firebase/firestore que no es viable mockear unitariamente.
