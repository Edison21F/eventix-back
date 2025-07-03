import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { logger } from '../config/logging.config';

@Injectable()
export class DatabaseMonitorService implements OnModuleInit, OnModuleDestroy {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    this.dataSource.initialize()
      .then(() => {
        logger.info('✅ Database connected successfully');
      })
      .catch((error) => {
        logger.error('❌ Database connection failed', {
          message: error.message,
          stack: error.stack,
        });
      });

    // Escuchar errores en la conexión en runtime (MySQL client)
    const driver = this.dataSource.driver;
    if ('mysql' === driver.options.type) {
      const pool = (driver as any).pool; // pool mysql2

      pool.on('error', (error) => {
        logger.error('❌ MySQL Pool error', {
          message: error.message,
          stack: error.stack,
        });
      });
    }
  }

  async onModuleDestroy() {
    await this.dataSource.destroy();
  }
}
