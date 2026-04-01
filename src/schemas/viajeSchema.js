import { z } from 'zod';

/**
 * Schemas de validación Zod para Keeptrip
 * Centraliza todas las validaciones de datos de viajes, paradas y fotos
 */

// ==================== HELPERS ====================

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidCoordinates = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// ==================== SCHEMAS BASE ====================

/**
 * Schema para coordenadas geográficas [lat, lng]
 */
export const CoordenadasSchema = z.tuple([
  z.number().min(-90).max(90), // latitud
  z.number().min(-180).max(180) // longitud
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
 * Schema para código de país ISO 2
 */
export const CodigoPaisSchema = z.string()
  .length(2, 'Código de país debe tener 2 caracteres')
  .regex(/^[A-Z]{2}$/, 'Código de país debe ser mayúsculas (ej: ES, MX)');

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
export const ParadaSchema = z.object({
  id: z.string().optional(),
  nombre: z.string()
    .min(1, 'Nombre de parada es requerido')
    .max(100, 'Nombre no puede exceder 100 caracteres'),
  coordenadas: CoordenadasSchema,
  fecha: FechaISOSchema.optional().nullable(),
  fechaLlegada: FechaISOSchema.optional().nullable(),
  fechaSalida: FechaISOSchema.optional().nullable(),
  paisCodigo: CodigoPaisSchema.optional(), // Puede diferir del país principal
  clima: z.object({
    desc: z.string().optional(),
    max: z.number().optional()
  }).optional().nullable(),
  tipo: z.enum(['place', 'city', 'landmark', 'other']).default('place'),
  // Nuevo: transporte entre puntos (ayuda logística / storytelling)
  transporte: z.enum(['avion','tren','auto','bus','otro']).optional(),
  // Nota corta vinculada a la parada (micro‑momento)
  notaCorta: z.string().max(200).optional().nullable(),
  // Relato por parada (historia fragmentada)
  relato: z.string().max(3000).optional().nullable(),
  viajeId: z.string().optional() // Referencia al viaje padre
});

// ==================== VIAJE ====================


/**
 * Schema base para un viaje (sin refinements a nivel objeto)
 */
export const ViajeSchemaBase = z.object({
  id: z.string().optional(),
  // Datos de país
  code: CodigoPaisSchema,
  nombreEspanol: z.string()
    .min(1, 'Nombre del país es requerido')
    .max(100, 'Nombre del país no puede exceder 100 caracteres'),
  // Título y descripción
  titulo: z.string()
    .min(1, 'Título es requerido')
    .max(200, 'Título no puede exceder 200 caracteres')
    .refine(isNonEmptyString, { message: 'Título no puede estar vacío' }),
  texto: z.string()
    .max(10000, 'El relato no puede exceder 10000 caracteres')
    .optional()
    .nullable()
    .default(''),
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
  presupuesto: z.string().optional().nullable(), // p.ej. 'Mochilero', 'Lujo'
  vibe: z.array(z.string()).default([]), // tags de identidad (Relax, Aventura...)
  highlights: z.object({
    topFood: z.string().max(120).optional().nullable(),
    topView: z.string().max(120).optional().nullable(),
    topTip: z.string().max(240).optional().nullable()
  }).optional().nullable(),
  // Companions + sharing
  companions: z.array(z.object({
    name: z.string(),
    email: z.string().optional().nullable(),
    userId: z.string().optional().nullable(),
    status: z.enum(['pending','accepted']).default('pending')
  })).default([]),
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
  nombreEspanol: z.string().min(1),
  titulo: z.string().min(1),
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
      const primerError = error.errors[0];
      return {
        esValido: false,
        mensaje: primerError.message,
        errores: error.flatten().fieldErrors
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
      return {
        esValido: false,
        mensaje: error.errors[0].message,
        errores: error.flatten().fieldErrors
      };
    }
    return { esValido: false, mensaje: 'Error de validación desconocido' };
  }
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
      return {
        esValido: false,
        mensaje: error.errors[0].message,
        errores: error.flatten().fieldErrors
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
      return {
        esValido: false,
        mensaje: error.errors[0].message
      };
    }
    return { esValido: false, mensaje: 'Coordenadas inválidas' };
  }
}

// ==================== EXPORTS ====================

export default {
  ViajeSchema,
  ParadaSchema,
  FotoSchema,
  CrearViajeSchema,
  ActualizarViajeSchema,
  ViajeMinimalSchema,
  validarViaje,
  validarParada,
  validarFoto,
  validarCoordenadas
};
