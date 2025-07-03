import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { key } from './key';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql', // Cambia a 'mysql' si usas MySQL
  host: key.db.host,
  port: key.db.port, // Puerto por defecto de MySQL
  username: key.db.user,
  password: key.db.password,
  database: key.db.database,
  entities: [
    // Lista automática usando el plugin TypeORM (ver más abajo)
    __dirname + '/../models/**/*.entity.{ts,js}'

  ],
  synchronize: true, // Solo para desarrollo
  logging: ['query', 'error']
 
};

// Configuración para migraciones
export const typeOrmCliConfig = {
  ...typeOrmConfig,
  migrations: ['src/db/migrations/*.ts'],
  subscribers: ['src/db/subscribers/*.ts']
};
