import { z } from 'zod';
import { normalizeCountryCode } from '@shared/lib/utils/countryUtils';

/**
 * Schemas de validación Zod para Keeptrip
 * Centraliza todas las validaciones de datos de viajes, paradas y fotos
 */

// ==================== HELPERS ====================

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Optional string that treats empty/whitespace/null input as `undefined`, so
 * `.optional()` safely passes instead of triggering `.min(1)` Zod errors.
 * (Zod does not skip `.min(1)` for `""` because `"" !== undefined`.)
 */
const optionalCleanString = (maxLen = 5000) =>
  z
    .string()
    .max(maxLen)
    .nullable()
    .optional()
    .transform((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val));

const isValidCoordinates = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  // Universal GIS/Mapbox/GeoJSON convention: [longitude, latitude].
  const [lng, lat] = coords;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};

// ==================== SCHEMAS BASE ====================

/**
 * Schema para coordenadas geográficas [longitud, latitud]
 */
export const CoordenadasSchema = z.tuple([
  z.number().min(-180, 'Longitud inválida').max(180, 'Longitud inválida'), // longitud
  z.number().min(-90, 'Latitud inválida').max(90, 'Latitud inválida') // latitud
]).refine(isValidCoordinates, {
  message: 'Coordenadas inválidas'
});

/**
 * Schema para fechas ISO (YYYY-MM-DD)
 */
export const FechaISOSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (usar YYYY-MM-DD)')
  .refine((date) => !isNaN(Date.parse(date)), {
    message: 'Fecha inválida'
  });

/**
 * Schema para URLs de imágenes
 */
export const URLImagenSchema = z.string()
  .refine(
    (url) => {
      // Permitir URLs de Firebase Storage, HTTP/HTTPS, o data URLs
      if (url.startsWith('data:image/')) return true;
      if (url.startsWith('http://') || url.startsWith('https://')) return true;
      if (url.startsWith('gs://')) return true; // Firebase Storage
      return false;
    },
    { message: 'URL de imagen inválida' }
  )
  .optional()
  .nullable();

/**
 * Schema para código de país ISO 2.
 * Preprocess-tolerant: accepts empty strings, ISO-3 codes and mixed casing by
 * normalizing to a clean ISO-2 token before validation. This prevents the
 * "Código de país debe tener 2 caracteres" save-blocking error.
 */
export const CodigoPaisSchema = z
  .preprocess((val) => {
    if (!val || typeof val !== 'string') return '';
    return normalizeCountryCode(val) || val.trim().slice(0, 2).toUpperCase();
  }, z.string().max(2).optional().or(z.literal('')))
  .nullable()
  .optional();

// ==================== FOTO ====================

/**
 * Schema para fotos individuales de galería (preparado para futura implementación)
 */
export const FotoSchema = z.object({
  id: z.string().optional(),
  url: URLImagenSchema,
  orden: z.number().int().min(0).default(0),
  esPortada: z.boolean().default(false),
  caption: z.string().max(280, 'Caption no puede exceder 280 caracteres').optional().nullable(),
  fechaCaptura: FechaISOSchema.optional().nullable(),
  createdAt: z.date().optional()
});

/**
 * Schema para crédito de fotos
 */
export const CreditoFotoSchema = z.object({
  nombre: z.string().optional().nullable(),
  link: z.string().url().optional().nullable()
}).nullable();

// ==================== PARADA ====================

/**
 * Schema para paradas/ciudades de un viaje
 */
export const ParadaSchemaBase = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(1, 'El nombre de la parada es obligatorio').max(100, 'Nombre no puede exceder 100 caracteres'),
  // Alias opcional: los formularios pueden enviar `ciudad` vacío; nunca debe fallar.
  ciudad: optionalCleanString(120),
  coordenadas: CoordenadasSchema,
  fecha: FechaISOSchema.optional().nullable(),
  fechaLlegada: FechaISOSchema.optional().nullable(),
  fechaSalida: FechaISOSchema.optional().nullable(),
  paisCodigo: CodigoPaisSchema.optional(), // Puede diferir del país principal
  // Optional textual country name (legacy passthrough; never required).
  pais: optionalCleanString(100),
  clima: z.object({
    desc: z.string().optional(),
    max: z.number().optional()
  }).optional().nullable(),
  tipo: z.enum(['place', 'city', 'landmark', 'other']).default('place'),
  // Transport connector between stops. Canonical values are the new
  // English tokens; legacy Spanish tokens are kept for backward compatibility
  // with already-persisted documents. Empty strings are coerced to null so the
  // enum never fails on an unselected transport picker.
  transporte: z.preprocess(
    (val) => (!val || val === '' ? null : val),
    z
      .enum(['plane', 'train', 'car', 'ship', 'bus', 'avion', 'tren', 'auto', 'barco', 'otro'])
      .nullable()
      .optional()
  ),
  // Favorite stop heart toggle.
  esFavorita: z.boolean().default(false).optional(),
  // Short headline / key memory (micro-chronicle).
  titular: optionalCleanString(160),
  // Extended long-form note (revealed on demand).
  nota: optionalCleanString(5000),
  // 1-tap city vibe chips (multi-select).
  vibes: z.array(z.string()).default([]).optional(),
  // Categorized places & POIs (cost-free, local only).
  lugares: z.preprocess(
    (val) =>
      Array.isArray(val)
        ? val.filter((item) => item && typeof item.nombre === 'string' && item.nombre.trim().length > 0)
        : [],
    z
      .array(
        z.object({
          id: z.string(),
          nombre: z.string().trim().min(1, 'El nombre del lugar es obligatorio').max(120),
          categoria: z.enum(['monumento', 'gastronomia', 'mirador', 'cultura', 'hotel'])
        })
      )
      .default([])
      .optional()
  ),
  // Nota corta vinculada a la parada (micro‑momento)
  notaCorta: z.string().max(200).optional().nullable(),
  // Relato por parada (historia fragmentada)
  relato: z.string().max(3000).optional().nullable(),
  viajeId: z.string().optional() // Referencia al viaje padre
});

export const ParadaSchema = ParadaSchemaBase.refine(
  (data) => {
    const inicio = data.fechaLlegada || data.fecha;
    if (inicio && data.fechaSalida) {
      return new Date(data.fechaSalida) >= new Date(inicio);
    }
    return true;
  },
  {
    message: 'La fecha de salida no puede ser anterior a la fecha de llegada',
    path: ['fechaSalida']
  }
);

// ==================== VIAJE ====================


/**
 * Schema base para un viaje (sin refinements a nivel objeto)
 */
export const ViajeSchemaBase = z.object({
  id: z.string().optional(),
  // Datos de país
  code: CodigoPaisSchema,
  // Optional textual country name (legacy passthrough; never required —
  // multi-country/legacy trips legitimately have no single country name).
  pais: optionalCleanString(100),
  nombreEspanol: optionalCleanString(100),
  // Título y descripción
  titulo: z.string().trim().min(1, 'El título del viaje es obligatorio').max(200, 'El título no puede exceder 200 caracteres'),
  // Optional destination label (never required; empty strings tolerated).
  destino: optionalCleanString(200),
  // General reflection / story.
  texto: optionalCleanString(5000),
  // Optional cover image URL produced by the media flow.
  portadaUrl: optionalCleanString(2000),
  // Fechas
  fechaInicio: FechaISOSchema,
  fechaFin: FechaISOSchema,
  // Rating
  rating: z.number()
    .int()
    .min(1, 'Rating mínimo es 1')
    .max(5, 'Rating máximo es 5')
    .default(5),
  // Foto principal (legacy - será fotoPortada en nuevo sistema)
  foto: URLImagenSchema,
  fotoCredito: CreditoFotoSchema,
  // Nuevos campos para galería (preparados para futuro)
  fotoPortada: URLImagenSchema, // URL de la foto principal
  totalFotos: z.number().int().min(0).max(30).default(1), // Límite de 30 fotos
  // Storytelling metadata (nuevo)
  presupuesto: optionalCleanString(50), // p.ej. 'Mochilero', 'Lujo'
  vibe: z.preprocess((val) => (Array.isArray(val) ? val.filter(Boolean) : []), z.array(z.string())).default([]),
  highlights: z
    .object({
      topFood: optionalCleanString(200),
      topView: optionalCleanString(200),
      topTip: optionalCleanString(200)
    })
    .partial()
    .default({})
    .optional(),
  // Companions + sharing
  // Level-1 companion taxonomy driving Analytics & the Traveler Hub ranking.
  // Empty strings are coerced to null so an unselected chip never fails the enum.
  companionType: z.preprocess(
    (val) => (!val || val === '' ? null : val),
    z.enum(['solo', 'couple', 'family', 'friends']).nullable().optional()
  ),
  // Accepts both the rich invitation object and plain nominal names (chips).
  // Empty/blank entries are filtered out so `.min(1)`-style constraints never fire.
  companions: z.preprocess(
    (val) =>
      Array.isArray(val)
        ? val.filter((item) => (typeof item === 'string' ? item.trim().length > 0 : Boolean(item)))
        : [],
    z
      .array(
        z.union([
          z.string(),
          z.object({
            id: z.string().optional(),
            name: z.string().optional(),
            email: z.string().optional().nullable(),
            userId: z.string().optional().nullable(),
            status: z.enum(['pending', 'accepted']).optional().default('pending')
          })
        ])
      )
      .default([])
      .optional()
  ),
  sharedWith: z.array(z.string()).default([]), // uids que aceptaron ver el viaje
  // Metadata de ubicación
  banderas: z.array(z.string().url()).default([]),
  ciudades: z.string().optional().nullable(), // CSV de ciudades
  // Timestamps
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  // Usuario
  userId: z.string().optional()
});

/**
 * Schema completo para un viaje (con refinements)
 */
export const ViajeSchema = ViajeSchemaBase.refine(
  (data) => {
    // Validar que fechaFin >= fechaInicio
    const inicio = new Date(data.fechaInicio);
    const fin = new Date(data.fechaFin);
    return fin >= inicio;
  },
  {
    message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
    path: ['fechaFin']
  }
);

// ==================== VALIDACIONES PARCIALES ====================

/**
 * Schema para creación de viaje (sin ID)
 * Usa el schema base para permitir .omit()
 */
export const CrearViajeSchema = ViajeSchemaBase.omit({ id: true, createdAt: true, updatedAt: true });

/**
 * Schema para actualización de viaje (todos los campos opcionales excepto ID)
 */
export const ActualizarViajeSchema = ViajeSchemaBase.partial().required({ id: true });

/**
 * Schema minimal para validación rápida (solo campos críticos)
 */
export const ViajeMinimalSchema = z.object({
  code: CodigoPaisSchema,
  nombreEspanol: optionalCleanString(100),
  titulo: z.string().trim().min(1, 'El título del viaje es obligatorio'),
  fechaInicio: FechaISOSchema,
  fechaFin: FechaISOSchema
}).refine(
  (data) => new Date(data.fechaFin) >= new Date(data.fechaInicio),
  {
    message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
    path: ['fechaFin']
  }
);

// ==================== FUNCIONES DE VALIDACIÓN ====================

/**
 * Valida datos de viaje y retorna resultado estructurado
 * Compatible con la interfaz existente de validarDatosViaje()
 * 
 * @param {Object} datosViaje - Datos del viaje a validar
 * @param {boolean} strict - Si true, usa ViajeSchema completo. Si false, usa ViajeMinimalSchema
 * @returns {{ esValido: boolean, mensaje?: string, errores?: Object }}
 */
export function validarViaje(datosViaje, strict = false) {
  try {
    const schema = strict ? ViajeSchema : ViajeMinimalSchema;
    schema.parse(datosViaje);
    return { esValido: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const primerError = (error.issues || error.errors)?.[0];
      return {
        esValido: false,
        mensaje: primerError ? primerError.message : (error.message || 'Error de validación'),
        errores: typeof error.flatten === 'function' ? error.flatten().fieldErrors : {}
      };
    }
    return {
      esValido: false,
      mensaje: 'Error de validación desconocido'
    };
  }
}

/**
 * Valida una parada
 */
export function validarParada(parada) {
  try {
    ParadaSchema.parse(parada);
    return { esValido: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const primerError = (error.issues || error.errors)?.[0];
      return {
        esValido: false,
        mensaje: primerError ? primerError.message : (error.message || 'Error de validación'),
        errores: typeof error.flatten === 'function' ? error.flatten().fieldErrors : {}
      };
    }
    return { esValido: false, mensaje: 'Error de validación desconocido' };
  }
}

/**
 * Valida una lista de paradas dentro del rango maestro de un viaje.
 * - Cada parada debe ser válida individualmente según ParadaSchema.
 * - Límite Maestro Inquebrantable:
 *   paradaInicio >= viaje.fechaInicio y paradaFin <= viaje.fechaFin.
 * - Superposición Permitida:
 *   Las paradas hermanas SÍ pueden superponerse total o parcialmente (ej. excursiones de un día).
 * 
 * @param {Array<Object>} paradas - Lista de paradas a validar
 * @param {{ fechaInicio?: string, fechaFin?: string }} [viajeFechas] - Fechas maestras del viaje
 * @returns {{ esValido: boolean, mensaje?: string, errores?: Object, index?: number }}
 */
export function validarParadasEnViaje(paradas = [], { fechaInicio, fechaFin } = {}) {
  if (!Array.isArray(paradas)) {
    return { esValido: false, mensaje: 'Paradas debe ser un array' };
  }

  const viajeInicio = fechaInicio ? new Date(fechaInicio) : null;
  const viajeFin = fechaFin ? new Date(fechaFin) : null;

  for (let i = 0; i < paradas.length; i++) {
    const parada = paradas[i];
    const paradaRes = validarParada(parada);
    if (!paradaRes.esValido) {
      return {
        esValido: false,
        mensaje: `Parada "${parada?.nombre || i}": ${paradaRes.mensaje}`,
        errores: paradaRes.errores,
        index: i
      };
    }

    const stopInicioStr = parada.fechaLlegada || parada.fecha;
    const stopFinStr = parada.fechaSalida || parada.fechaLlegada || parada.fecha;

    if (stopInicioStr && viajeInicio) {
      const stopInicio = new Date(stopInicioStr);
      if (stopInicio < viajeInicio) {
        return {
          esValido: false,
          mensaje: `La parada "${parada?.nombre || i}" no puede comenzar antes del inicio del viaje (${fechaInicio})`,
          index: i
        };
      }
    }

    if (stopFinStr && viajeFin) {
      const stopFin = new Date(stopFinStr);
      if (stopFin > viajeFin) {
        return {
          esValido: false,
          mensaje: `La parada "${parada?.nombre || i}" no puede finalizar después del fin del viaje (${fechaFin})`,
          index: i
        };
      }
    }
  }

  return { esValido: true };
}

/**
 * Valida una foto de galería
 */
export function validarFoto(foto) {
  try {
    FotoSchema.parse(foto);
    return { esValido: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const primerError = (error.issues || error.errors)?.[0];
      return {
        esValido: false,
        mensaje: primerError ? primerError.message : (error.message || 'Error de validación'),
        errores: typeof error.flatten === 'function' ? error.flatten().fieldErrors : {}
      };
    }
    return { esValido: false, mensaje: 'Error de validación desconocido' };
  }
}

/**
 * Valida coordenadas
 */
export function validarCoordenadas(coordenadas) {
  try {
    CoordenadasSchema.parse(coordenadas);
    return { esValido: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const primerError = (error.issues || error.errors)?.[0];
      return {
        esValido: false,
        mensaje: primerError ? primerError.message : 'Coordenadas inválidas'
      };
    }
    return { esValido: false, mensaje: 'Coordenadas inválidas' };
  }
}

// ==================== EXPORTS ====================

export default {
  ViajeSchema,
  ParadaSchema,
  ParadaSchemaBase,
  FotoSchema,
  CrearViajeSchema,
  ActualizarViajeSchema,
  ViajeMinimalSchema,
  validarViaje,
  validarParada,
  validarParadasEnViaje,
  validarFoto,
  validarCoordenadas
};
