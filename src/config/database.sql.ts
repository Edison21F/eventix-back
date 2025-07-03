import { createPool } from 'mysql2/promise'; // Usando mysql2 para promesas
import { key } from './key'; // Importa las claves de configuración

export const sqlConfig = {
  host: key.db.host,
  port: key.db.port, // Puerto por defecto de MySQL
  user: key.db.user, // Usuario de la base de datos
  password: key.db.password, // Esto debería venir de key.ts
  database: key.db.database, // Nombre de la base de datos
  connectionLimit: 20, // Máximo de conexiones
};

// Crear un pool de conexiones
export const sqlPool = createPool(sqlConfig);

// Tipos de tablas para verificación
export const requiredTables = [
  'users',
  'events',
  'orders',
  'tickets'
];
