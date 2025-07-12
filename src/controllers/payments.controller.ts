// src/sales/payments/payments.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  ParseIntPipe, 
  Query,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../Dto/create//create-payment.dto';
import { UpdatePaymentDto } from '../Dto/update/update-payment.dto';
import { JwtAuthGuard } from '../lib/guards/jwt-auth.guard';
import { RolesGuard } from '../lib/guards/roles.guard';
import { PermissionsGuard } from '../lib/guards/permissions.guard';
import { Roles } from '../lib/decorators/roles.decorator';
import { RequirePermissions } from '../lib/decorators/permissions.decorator';
import { CurrentUser } from '../lib/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @RequirePermissions('create_order') // Los customers pueden crear pagos para sus órdenes
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: any
  ) {
    const payment = await this.paymentsService.create(createPaymentDto);
    return {
      message: 'Pago iniciado exitosamente',
      payment,
      initiatedBy: user.email
    };
  }

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('read_order')
  async findAll(
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('order') orderId?: number,
    @Query('search') search?: string
  ) {
    if (search) {
      return {
        message: 'Resultados de búsqueda de pagos',
        payments: await this.paymentsService.searchPayments(search)
      };
    }

    if (status) {
      return {
        message: `Pagos con estado ${status}`,
        payments: await this.paymentsService.findByStatus(status)
      };
    }

    if (method) {
      return {
        message: `Pagos con método ${method}`,
        payments: await this.paymentsService.findByMethod(method)
      };
    }

    if (orderId) {
      return {
        message: `Pagos de la orden ${orderId}`,
        payments: await this.paymentsService.findByOrder(orderId)
      };
    }

    return {
      message: 'Lista de todos los pagos',
      payments: await this.paymentsService.findAll()
    };
  }

  @Get('statistics')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('view_reports')
  async getStatistics() {
    const statistics = await this.paymentsService.getPaymentStatistics();
    return {
      message: 'Estadísticas de pagos',
      statistics
    };
  }

  @Get('methods')
  @RequirePermissions('read_order')
  getPaymentMethods() {
    return {
      message: 'Métodos de pago disponibles',
      methods: [
        { value: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
        { value: 'PAYPAL', label: 'PayPal' },
        { value: 'BANK_TRANSFER', label: 'Transferencia Bancaria' },
        { value: 'CRYPTO', label: 'Criptomonedas' }
      ]
    };
  }

  @Get('statuses')
  @RequirePermissions('read_order')
  getPaymentStatuses() {
    return {
      message: 'Estados de pago disponibles',
      statuses: [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'COMPLETED', label: 'Completado' },
        { value: 'FAILED', label: 'Fallido' }
      ]
    };
  }

  @Get(':id')
  @RequirePermissions('read_order')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    const payment = await this.paymentsService.findOne(id);

    // Verificar que el usuario puede ver este pago
    if (user.roles?.includes('customer') && !user.roles?.includes('admin')) {
      if (payment.order.user.id !== user.userId) {
        return {
          message: 'No tienes permisos para ver este pago',
          statusCode: 403
        };
      }
    }

    return {
      message: 'Detalles del pago',
      payment
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('update_order')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: any
  ) {
    const payment = await this.paymentsService.update(id, updatePaymentDto);
    return {
      message: 'Pago actualizado exitosamente',
      payment,
      updatedBy: user.email
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin')
  @RequirePermissions('delete_order')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    await this.paymentsService.remove(id);
    return {
      message: 'Pago eliminado exitosamente',
      deletedBy: user.email
    };
  }

  // Endpoints específicos para gestión de pagos

  @Get('order/:orderId')
  @RequirePermissions('read_order')
  async getPaymentsByOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: any
  ) {
    const payments = await this.paymentsService.findByOrder(orderId);

    // Verificar permisos para customers
    if (user.roles?.includes('customer') && !user.roles?.includes('admin') && payments.length > 0) {
      // Obtener la primera transacción para verificar el usuario
      const firstPayment = await this.paymentsService.findOne(payments[0].id);
      if (firstPayment.order.user.id !== user.userId) {
        return {
          message: 'No tienes permisos para ver estos pagos',
          statusCode: 403
        };
      }
    }

    return {
      message: `Pagos de la orden ${orderId}`,
      payments,
      count: payments.length
    };
  }

  @Get('by-status/:status')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('read_order')
  async getPaymentsByStatus(@Param('status') status: string) {
    const payments = await this.paymentsService.findByStatus(status);
    return {
      message: `Pagos con estado ${status}`,
      payments,
      count: payments.length
    };
  }

  @Get('by-method/:method')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('view_reports')
  async getPaymentsByMethod(@Param('method') method: string) {
    const payments = await this.paymentsService.findByMethod(method);
    return {
      message: `Pagos con método ${method}`,
      payments,
      count: payments.length
    };
  }

  @Post(':id/refund')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('process_refund')
  async processRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount?: number,
    @CurrentUser() user?: any
  ) {
    await this.paymentsService.processRefund(id, amount);
    return {
      message: 'Reembolso procesado exitosamente',
      processedBy: user.email
    };
  }

  // Endpoint para reenviar notificación de pago
  @Post(':id/resend-notification')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('update_order')
  async resendNotification(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    const payment = await this.paymentsService.findOne(id);
    
    // Aquí se implementaría el reenvío de notificación
    // Por ahora solo registramos el evento
    
    return {
      message: 'Notificación de pago reenviada',
      payment: {
        id: payment.id,
        transactionId: payment.transactionId,
        status: payment.status
      },
      resentBy: user.email
    };
  }

  // Endpoint para webhook de pagos (sin autenticación)
  @Post('webhook')
  async handleWebhook(@Body() webhookData: any) {
    // Aquí se manejarían las notificaciones de webhooks de gateways de pago
    // Por seguridad, se debe verificar la firma del webhook
    
    return {
      message: 'Webhook procesado',
      received: true
    };
  }
}