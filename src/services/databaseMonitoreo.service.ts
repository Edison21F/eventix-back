import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { logger } from '../config/logging.config';

@Injectable()
export class DatabaseMonitorService implements OnModuleInit, OnModuleDestroy {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    if (!this.dataSource.isInitialized) {
      try {
        await this.dataSource.initialize();
        logger.info('✅ Database connected successfully');
      } catch (error) {
        logger.error('❌ Database connection failed', {
          message: error.message,
          stack: error.stack,
        });
      }
    } else {
      logger.info('⚠️ Database connection already initialized');
    }

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
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      logger.info('✅ Database connection destroyed');
    }
  }
}
