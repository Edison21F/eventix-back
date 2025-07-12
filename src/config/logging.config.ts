// src/config/logging.config.ts

import * as winston from 'winston';
import * as moment from 'moment-timezone';
import * as fs from 'fs';
import * as path from 'path';
import { key } from '../key';

const logsDir = path.join(__dirname, '../../logs');

// Crea la carpeta "logs" si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato de hora en zona horaria Ecuador
const ecuadorTime = () => moment().tz('America/Guayaquil').format('YYYY-MM-DD HH:mm:ss');

// Formato personalizado para los logs
const logFormat = winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
  
  if (stack) {
    msg += `\nStack: ${stack}`;
  }

  if (metadata && Object.keys(metadata).length) {
    msg += ` | Meta: ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Crear el logger principal
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: ecuadorTime }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    logFormat
  ),
  transports: [
    // Solo archivo - TODO SE GUARDA EN app.log
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'debug', // Capturar desde debug hacia arriba
      handleExceptions: true,
      handleRejections: true,
      maxsize: 10 * 1024 * 1024, // 10MB por archivo
      maxFiles: 5, // Mantener 5 archivos rotados
      tailable: true
    })
  ],
  exitOnError: false,
  // Capturar excepciones no manejadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      handleExceptions: true
    })
  ],
  // Capturar promesas rechazadas
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      handleRejections: true
    })
  ]
});

// Solo mostrar en consola si NO está en producción
if (key.app.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: ecuadorTime }),
        logFormat
      ),
    })
  );
}

// Logger específico para errores de base de datos
export const dbLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: ecuadorTime }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let logMsg = `${timestamp} [DATABASE-${level.toUpperCase()}] ${message}`;
      
      if (stack) {
        logMsg += `\nStack: ${stack}`;
      }
      
      if (meta && Object.keys(meta).length) {
        logMsg += `\nDatabase Meta: ${JSON.stringify(meta, null, 2)}`;
      }
      
      return logMsg;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'error'
    })
  ]
});

// Logger específico para TypeORM
export const typeormLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: ecuadorTime }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [TYPEORM-${level.toUpperCase()}] ${message} ${meta ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'debug'
    })
  ]
});

// Interceptar console.log, console.error, etc. para redirigir a app.log
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  info: console.info
};

// Solo interceptar en producción
if (key.app.env === 'production') {
  console.log = (...args) => {
    logger.info(args.join(' '));
  };

  console.error = (...args) => {
    logger.error(args.join(' '));
  };

  console.warn = (...args) => {
    logger.warn(args.join(' '));
  };

  console.debug = (...args) => {
    logger.debug(args.join(' '));
  };

  console.info = (...args) => {
    logger.info(args.join(' '));
  };
}

// Restaurar console original si es necesario
export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
};