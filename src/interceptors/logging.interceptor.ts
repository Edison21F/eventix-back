import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logger } from '../config/logging.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = req;
    const now = Date.now();

    logger.info('Incoming Request', {
      method,
      url,
      body,
      query,
      params,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const res = context.switchToHttp().getResponse();
          logger.info('Request Completed', {
            statusCode: res.statusCode,
            duration: `${Date.now() - now}ms`,
            response: this.sanitizeResponse(data)
          });
        },
        error: (err) => {
          const res = context.switchToHttp().getResponse();
          logger.error('Request Failed', {
            statusCode: err.status || 500,
            duration: `${Date.now() - now}ms`,
            error: {
              name: err.name,
              message: err.message,
              stack: process.env.NODE_ENV === 'production' ? undefined : err.stack 
            }
          });
        }
      })
    );
  }

  private sanitizeResponse(data: any) {
    if (!data) return data;
    // Sanitize sensitive data if needed
    if (typeof data === 'object' && data.password) {
      return { ...data, password: '******' };
    }
    if (typeof data === 'object' && data.token) {
      return { ...data, token: '******' };
    }
    return data;
  }
}
