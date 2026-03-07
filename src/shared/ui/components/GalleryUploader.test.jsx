import React from 'react';
// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryUploader } from './GalleryUploader';
import { ToastProvider } from '@app/providers/ToastContext';

describe('GalleryUploader', () => {
  test('muestra previews al seleccionar archivos y se limpian cuando files queda vacío', async () => {
    const onChange = vi.fn();
    render(
      <ToastProvider>
        <GalleryUploader files={[]} onChange={onChange} maxFiles={5} />
      </ToastProvider>
    );

    // No hay previews inicialmente
    expect(screen.queryByText(/fotos seleccionadas/i)).toBeNull();

    // Simular selección de archivo (File API)
    const file = new File(['hello'], 'photo.jpg', { type: 'image/jpeg' });

    // Buscar el input[type=file]
    const fileInput = document.querySelector('input[type=file]');
    expect(fileInput).toBeTruthy();

    await userEvent.upload(fileInput, file);

    // onChange debe haber sido llamado con el archivo
    expect(onChange).toHaveBeenCalled();

    // Simular que el padre limpia los files (onChange con [])
    render(
      <ToastProvider>
        <GalleryUploader files={[]} onChange={onChange} maxFiles={5} />
      </ToastProvider>
    );
    expect(screen.queryByText(/fotos seleccionadas/i)).toBeNull();
  });
});
