// @vitest-environment jsdom
import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

vi.mock('@app/providers/AuthContext', () => ({
  useAuth: () => ({ usuario: { uid: 'u1' } }),
}));

vi.mock('@app/providers/ToastContext', () => ({
  useToast: () => ({ pushToast: vi.fn() }),
}));

vi.mock('@app/providers/UploadContext', () => ({
  useUpload: () => ({ getEstadoViaje: vi.fn(() => ({})), reintentarFoto: vi.fn() }),
}));

vi.mock('@shared/lib/hooks/useWindowSize', () => ({
  useWindowSize: () => ({ isMobile: false }),
}));

const mockReloadParadas = vi.fn(async () => {});
const mockRecargarGaleria = vi.fn();

let mockDataHook = {
  viajeBase: { id: 'v1', nombreEspanol: 'Madrid' },
  hasViajeData: true,
  data: { id: 'v1', titulo: 'Trip', texto: 'Notas' },
  ownerUid: 'u1',
  paradas: [{ id: 'p1' }, { id: 'p2' }],
  isSharedTrip: false,
  ownerDisplayName: null,
  reloadParadas: mockReloadParadas,
};

let mockUiHook = {
  showEditModal: false,
  setShowEditModal: vi.fn(),
  showMapModal: false,
  setShowMapModal: vi.fn(),
  hoveredIndex: null,
  setHoveredIndex: vi.fn(),
  activeParadaIndex: 0,
  setParadaRef: vi.fn(),
  carouselRef: { current: null },
  activeCarouselDot: 0,
  handleCarouselScroll: vi.fn(),
  handleMarkerHover: vi.fn(),
  handleMarkerHoverEnd: vi.fn(),
  handleMarkerClick: vi.fn(),
};

vi.mock('./hooks/useVisorViajeData', () => ({
  useVisorViajeData: () => mockDataHook,
}));

vi.mock('./hooks/useVisorViajeUI', () => ({
  useVisorViajeUI: () => mockUiHook,
}));

vi.mock('./hooks/useVisorViajeStory', () => ({
  useVisorViajeStory: () => ({
    fotoMostrada: null,
    storyData: { titulo: 'Trip' },
  }),
}));

vi.mock('./hooks/useVisorViajeGallery', () => ({
  useVisorViajeGallery: () => ({
    galeria: { fotos: [], recargar: mockRecargarGaleria },
    fotosSubiendo: [],
    captionDrafts: {},
    showGalleryTools: false,
    toggleGalleryTools: vi.fn(),
    onReintentarFoto: vi.fn(),
    handleCaptionChange: vi.fn(),
    handleCaptionSave: vi.fn(),
    handleSetPortadaExistente: vi.fn(),
    handleEliminarFoto: vi.fn(),
  }),
}));

vi.mock('./components/VisorHero', () => ({
  default: ({ onDelete, onOpenEdit }) => (
    <div>
      <button data-testid="hero-delete" onClick={onDelete}>delete</button>
      <button data-testid="hero-open-edit" onClick={onOpenEdit}>edit</button>
    </div>
  ),
}));

vi.mock('./components/VisorRouteLayout', () => ({
  default: () => <div data-testid="route-layout" />,
}));

vi.mock('./components/VisorDestinoLayout', () => ({
  default: () => <div data-testid="destino-layout" />,
}));

vi.mock('./components/VisorBitacoraSection', () => ({
  default: () => <div data-testid="bitacora-section" />,
}));

vi.mock('./components/VisorContextSection', () => ({
  default: () => <div data-testid="context-section" />,
}));

vi.mock('./components/VisorGallerySection', () => ({
  default: () => <div data-testid="gallery-section" />,
}));

vi.mock('./components/VisorTimelineSection', () => ({
  default: () => <div data-testid="timeline-section" />,
}));

vi.mock('@features/viajes/editor/ui/EdicionModal', () => ({
  default: ({ onSave }) => (
    <button data-testid="modal-save" onClick={() => onSave('v1', { titulo: 'nuevo' })}>
      save
    </button>
  ),
}));

import VisorViaje from './VisorViaje';

afterEach(() => cleanup());

describe('VisorViaje (phase 4 assembler)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataHook = {
      viajeBase: { id: 'v1', nombreEspanol: 'Madrid' },
      hasViajeData: true,
      data: { id: 'v1', titulo: 'Trip', texto: 'Notas' },
      ownerUid: 'u1',
      paradas: [{ id: 'p1' }, { id: 'p2' }],
      isSharedTrip: false,
      ownerDisplayName: null,
      reloadParadas: mockReloadParadas,
    };
    mockUiHook = {
      showEditModal: false,
      setShowEditModal: vi.fn(),
      showMapModal: false,
      setShowMapModal: vi.fn(),
      hoveredIndex: null,
      setHoveredIndex: vi.fn(),
      activeParadaIndex: 0,
      setParadaRef: vi.fn(),
      carouselRef: { current: null },
      activeCarouselDot: 0,
      handleCarouselScroll: vi.fn(),
      handleMarkerHover: vi.fn(),
      handleMarkerHoverEnd: vi.fn(),
      handleMarkerClick: vi.fn(),
    };
  });

  test('renderiza layout de ruta cuando hay mas de una parada', () => {
    render(
      <VisorViaje
        viajeId="v1"
        bitacoraData={{}}
        bitacoraLista={[]}
        onClose={vi.fn()}
        onSave={vi.fn(async () => true)}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('route-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('destino-layout')).not.toBeInTheDocument();
  });

  test('renderiza layout destino cuando hay una sola parada', () => {
    mockDataHook.paradas = [{ id: 'solo' }];

    render(
      <VisorViaje
        viajeId="v1"
        bitacoraData={{}}
        bitacoraLista={[]}
        onClose={vi.fn()}
        onSave={vi.fn(async () => true)}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('destino-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('route-layout')).not.toBeInTheDocument();
  });

  test('al guardar desde edicion recarga paradas y galeria', async () => {
    const onSave = vi.fn(async () => true);
    mockUiHook.showEditModal = true;

    render(
      <VisorViaje
        viajeId="v1"
        bitacoraData={{}}
        bitacoraLista={[]}
        onClose={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('modal-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('v1', { titulo: 'nuevo' });
      expect(mockReloadParadas).toHaveBeenCalledTimes(1);
      expect(mockRecargarGaleria).toHaveBeenCalledTimes(1);
    });
  });

  test('boton delete del hero dispara onDelete con viajeId', () => {
    const onDelete = vi.fn();

    render(
      <VisorViaje
        viajeId="v1"
        bitacoraData={{}}
        bitacoraLista={[]}
        onClose={vi.fn()}
        onSave={vi.fn(async () => true)}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByTestId('hero-delete'));
    expect(onDelete).toHaveBeenCalledWith('v1');
  });
});
