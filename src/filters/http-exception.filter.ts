import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { logger } from '../config/logging.config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.status || 500;
    
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: exception.response?.message || exception.message,
    };

    logger.error('Exception Occurred', {
      status,
      path: ctx.getRequest().url,
      message: exception.message,
      stack: exception.stack,
      errorResponse
    });

    response.status(status).json(errorResponse);
  }
}
