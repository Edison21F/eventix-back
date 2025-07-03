// src/config/logging.config.ts

import * as winston from 'winston';
import * as moment from 'moment-timezone';
import * as fs from 'fs';
import * as path from 'path';
import { key } from './key'

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

// Crear el logger
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
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      handleExceptions: true,
    })
  ],
  exitOnError: false
});

// Mostrar también en consola si no está en producción
if (key.app.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: ecuadorTime }),
        logFormat
      ),
    })
  );
}
