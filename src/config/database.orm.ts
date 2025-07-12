import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { key } from '../key';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: key.db.host,
  port: key.db.port,
  username: key.db.user,
  password: key.db.password,
  database: key.db.database,
  entities: [
    // Core entities
    __dirname + '/../models/core/*.entity.{ts,js}',
    // Event entities
    __dirname + '/../models/events/*.entity.{ts,js}',
    // Cinema entities
    __dirname + '/../models/cinema/*.entity.{ts,js}',
    // Concert entities
    __dirname + '/../models/concert/*.entity.{ts,js}',
    // Transport entities
    __dirname + '/../models/transport/*.entity.{ts,js}',
    // Sales entities
    __dirname + '/../models/sales/*.entity.{ts,js}',
  ],
  synchronize: true, // Solo para desarrollo
  dropSchema: false, // Cambiado a false para evitar pérdida de datos
};

// Configuración para migraciones
export const typeOrmCliConfig = {
  ...typeOrmConfig,
  migrations: ['src/db/migrations/*.ts'],
  subscribers: ['src/db/subscribers/*.ts']
};