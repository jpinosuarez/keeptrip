/**
 * Sistema de logging centralizado para Keeptrip
 * 
 * Proporciona logging estructurado con contexto y está preparado
 * para integración futura con servicios externos como Sentry, Datadog, etc.
 * 
 * Uso:
 * import { logger } from './utils/logger';
 * logger.error('Fallo al cargar viaje', { viajeId: '123', userId: 'abc' });
 * logger.info('Viaje creado', { viajeId: '456' });
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

const isTestEnv = import.meta.env.MODE === 'test';

// Configuración del logger
const config = {
  minLevel: import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO,
  enableConsole: !isTestEnv,
  enableRemote: false, // Para Sentry u otro servicio futuro
  maxContextDepth: 3, // Profundidad máxima de objetos en contexto
  includeTimestamp: true,
  includeStackTrace: import.meta.env.DEV
};

/**
 * Formatea el timestamp actual
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Sanitiza el contexto para evitar logs excesivamente grandes
 */
function sanitizeContext(context, depth = 0) {
  if (depth > config.maxContextDepth) return '[Max Depth Reached]';
  
  if (context === null || context === undefined) return context;
  
  if (typeof context !== 'object') return context;
  
  if (Array.isArray(context)) {
    return context.slice(0, 10).map(item => sanitizeContext(item, depth + 1));
  }
  
  const sanitized = {};
  const keys = Object.keys(context).slice(0, 20); // Máximo 20 claves
  
  for (const key of keys) {
    // No logear información sensible
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret')) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    sanitized[key] = sanitizeContext(context[key], depth + 1);
  }
  
  return sanitized;
}

/**
 * Clase principal del Logger
 */
class Logger {
  constructor() {
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  clearUserId() {
    this.userId = null;
  }

  /**
   * Log genérico
   */
  log(level, message, context = {}) {
    if (level < config.minLevel) return;

    const logEntry = {
      level: Object.keys(LOG_LEVELS)[level],
      message,
      timestamp: config.includeTimestamp ? getTimestamp() : undefined,
      userId: this.userId,
      sessionId: this.sessionId,
      context: sanitizeContext(context),
      environment: import.meta.env.MODE
    };

    // Log a consola con formato bonito
    if (config.enableConsole) {
      this.logToConsole(level, logEntry);
    }

    // Enviar a servicio remoto (Sentry, etc.)
    if (config.enableRemote) {
      this.logToRemote();
    }

    return logEntry;
  }

  /**
   * Log a consola con colores
   */
  logToConsole(level, logEntry) {
    const styles = {
      [LOG_LEVELS.DEBUG]: 'color: #64748B; font-weight: normal',
      [LOG_LEVELS.INFO]: 'color: #0EA5E9; font-weight: bold',
      [LOG_LEVELS.WARN]: 'color: #F59E0B; font-weight: bold',
      [LOG_LEVELS.ERROR]: 'color: #EF4444; font-weight: bold',
      [LOG_LEVELS.FATAL]: 'color: #DC2626; font-weight: bold; font-size: 14px'
    };

    const style = styles[level] || '';
    const prefix = `[${logEntry.level}] ${logEntry.timestamp || ''}`;

    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(`%c${prefix}`, style, logEntry.message, logEntry.context);
        break;
      case LOG_LEVELS.INFO:
        console.info(`%c${prefix}`, style, logEntry.message, logEntry.context);
        break;
      case LOG_LEVELS.WARN:
        console.warn(`%c${prefix}`, style, logEntry.message, logEntry.context);
        break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.FATAL:
        console.error(`%c${prefix}`, style, logEntry.message, logEntry.context);
        if (config.includeStackTrace && logEntry.context?.error instanceof Error) {
          console.error('Stack trace:', logEntry.context.error.stack);
        }
        break;
      default:
        console.log(`%c${prefix}`, style, logEntry.message, logEntry.context);
    }
  }

  /**
   * Envío a servicio remoto (Sentry, Datadog, etc.)
   * Preparado para futura integración
   */
  logToRemote() {
    // TODO: Integrar con Sentry
    // if (window.Sentry && level >= LOG_LEVELS.ERROR) {
    //   window.Sentry.captureException(
    //     new Error(logEntry.message),
    //     {
    //       level: logEntry.level.toLowerCase(),
    //       extra: logEntry.context
    //     }
    //   );
    // }

    // TODO: O enviar a endpoint propio
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry)
    // }).catch(() => {}); // Silencioso si falla
  }

  // Métodos de conveniencia

  debug(message, context) {
    return this.log(LOG_LEVELS.DEBUG, message, context);
  }

  info(message, context) {
    return this.log(LOG_LEVELS.INFO, message, context);
  }

  warn(message, context) {
    return this.log(LOG_LEVELS.WARN, message, context);
  }

  error(message, context) {
    return this.log(LOG_LEVELS.ERROR, message, context);
  }

  fatal(message, context) {
    return this.log(LOG_LEVELS.FATAL, message, context);
  }

  /**
   * Log especializado para operaciones de Firebase
   */
  firebase(operation, details) {
    return this.info(`Firebase: ${operation}`, {
      ...details,
      service: 'firebase'
    });
  }

  /**
   * Log para navegación/routing
   */
  navigation(from, to, context) {
    return this.debug('Navegación', {
      from,
      to,
      ...context
    });
  }

  /**
   * Log para performance timing
   */
  performance(operation, durationMs, context) {
    const level = durationMs > 3000 ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    return this.log(level, `Performance: ${operation}`, {
      durationMs,
      ...context
    });
  }

  /**
   * Medir tiempo de una operación
   */
  async measure(operation, fn, context = {}) {
    const startTime = performance.now();
    let result;
    let error;

    try {
      result = await fn();
    } catch (err) {
      error = err;
    }

    const duration = performance.now() - startTime;
    
    if (error) {
      this.error(`${operation} falló`, {
        ...context,
        durationMs: duration,
        error: error.message,
        errorStack: error.stack
      });
      throw error;
    } else {
      this.performance(operation, duration, context);
      return result;
    }
  }
}

// Instancia singleton
export const logger = new Logger();

// Export de configuración para tests
export const __testing__ = {
  Logger,
  LOG_LEVELS,
  config
};

// Integración con AuthContext (opcional)
// Llamar desde AuthContext cuando el usuario inicie sesión
export function setLoggerUser(userId) {
  logger.setUserId(userId);
}

export function clearLoggerUser() {
  logger.clearUserId();
}

export default logger;
