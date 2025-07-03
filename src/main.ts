import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { logger } from './config/logging.config';
import { key } from './config/key';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'], // habilita logs de Nest
    });

    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    const port = key.app.port;
    await app.listen(port);

    logger.info(`✅ Application started on port ${port}`, {
      env: key.app.env,
      pid: key.app.pid,
    });
  } catch (err) {
    logger.error('❌ Error during application startup', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

bootstrap();

// Captura errores no manejados fuera de async/await
process.on('unhandledRejection', (reason: any) => {
  logger.error('🔴 Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack || null,
  });
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('🔴 Uncaught Exception', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
