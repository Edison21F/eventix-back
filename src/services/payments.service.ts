// src/sales/payments/payments.service.ts - CORREGIDO
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMetadata } from '../models/sales/payment.entity';
import { Order } from '../models/sales/order.entity';
import { CreatePaymentDto } from '../Dto/create/create-payment.dto';
import { UpdatePaymentDto } from '../Dto/update/update-payment.dto';
import { logger } from '../config/logging.config';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Verificar que la orden existe
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId },
      relations: ['payments']
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${createPaymentDto.orderId} no encontrada`);
    }

    // Validaciones de negocio
    if (order.status === 'PAID') {
      throw new BadRequestException('La orden ya ha sido pagada completamente');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('No se puede procesar pago para una orden cancelada');
    }

    if (order.status === 'REFUNDED') {
      throw new BadRequestException('No se puede procesar pago para una orden reembolsada');
    }

    // Calcular total ya pagado
    const totalPaid = order.payments
      ?.filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

    const remainingAmount = parseFloat(order.total.toString()) - totalPaid;

    if (createPaymentDto.amount > remainingAmount) {
      throw new BadRequestException(
        `El monto del pago (${createPaymentDto.amount}) excede el monto pendiente (${remainingAmount})`
      );
    }

    // Generar ID de transacción si no se proporciona
    const transactionId = createPaymentDto.transactionId || await this.generateTransactionId();

    // Verificar que el transaction ID es único
    const existingPayment = await this.paymentRepository.findOne({
      where: { transactionId }
    });

    if (existingPayment) {
      throw new BadRequestException(`Ya existe un pago con transaction ID: ${transactionId}`);
    }

    // Crear el pago
    const payment = this.paymentRepository.create({
      transactionId,
      order,
      amount: createPaymentDto.amount,
      method: createPaymentDto.method as any, // Cast to match entity type
      status: 'PENDING', // Inicialmente pendiente
      metadata: createPaymentDto.metadata,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Simular procesamiento del pago (en un caso real, aquí se llamaría al gateway de pago)
    await this.processPayment(savedPayment);

    logger.info('Payment created successfully', {
      paymentId: savedPayment.id,
      transactionId: savedPayment.transactionId,
      orderId: order.id,
      amount: savedPayment.amount,
      method: savedPayment.method
    });

    return this.findOne(savedPayment.id);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['order', 'order.user'],
      select: {
        id: true,
        transactionId: true,
        amount: true,
        method: true,
        status: true,
        metadata: true,
        processedAt: true,
        order: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          user: {
            id: true,
            email: true
          }
        }
      },
      order: {
        processedAt: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'order.user', 'order.items', 'order.items.ticketType'],
      select: {
        id: true,
        transactionId: true,
        amount: true,
        method: true,
        status: true,
        metadata: true,
        processedAt: true,
        order: {
          id: true,
          orderNumber: true,
          subtotal: true,
          taxes: true,
          total: true,
          status: true,
          createdAt: true,
          user: {
            id: true,
            email: true
          },
          items: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            ticketType: {
              id: true,
              name: true,
              price: true,
              currency: true
            }
          }
        }
      }
    });

    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    // Validaciones de estado
    if (payment.status === 'COMPLETED' && updatePaymentDto.status !== 'COMPLETED') {
      throw new BadRequestException('No se puede cambiar el estado de un pago completado');
    }

    if (payment.status === 'FAILED' && updatePaymentDto.status === 'COMPLETED') {
      throw new BadRequestException('No se puede completar un pago que falló');
    }

    // Solo permitir actualización de ciertos campos
    const allowedUpdates: Partial<Payment> = {};
    
    if (updatePaymentDto.status !== undefined) {
      allowedUpdates.status = updatePaymentDto.status as 'PENDING' | 'COMPLETED' | 'FAILED';
    }
    
    if (updatePaymentDto.metadata !== undefined) {
      allowedUpdates.metadata = updatePaymentDto.metadata;
    }

    if (Object.keys(allowedUpdates).length > 0) {
      await this.paymentRepository.update(id, allowedUpdates);

      // Si el pago se marca como completado, verificar si la orden debe marcarse como pagada
      if (updatePaymentDto.status === 'COMPLETED' && payment.status !== 'COMPLETED') {
        await this.checkAndUpdateOrderStatus(payment.order.id);
      }
    }

    logger.info('Payment updated successfully', {
      paymentId: id,
      changes: allowedUpdates
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);

    if (payment.status === 'COMPLETED') {
      throw new BadRequestException('No se puede eliminar un pago completado');
    }

    await this.paymentRepository.delete(id);

    logger.info('Payment deleted successfully', { paymentId: id });
  }

  // Métodos auxiliares privados
  private async generateTransactionId(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN-${timestamp}-${random}`;
  }

  private async processPayment(payment: Payment): Promise<void> {
    try {
      // Simular procesamiento del pago
      // En un caso real, aquí se haría la llamada al gateway de pago

      // Simular un delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simular éxito del pago (95% de éxito)
      const isSuccess = Math.random() > 0.05;

      const status = isSuccess ? 'COMPLETED' : 'FAILED';
      
      // Crear metadata actualizada de forma segura
      const updatedMetadata: PaymentMetadata = {
        ...payment.metadata,
        processedAt: new Date().toISOString(),
        gatewayResponse: isSuccess ? 'SUCCESS' : 'DECLINED',
        gatewayCode: isSuccess ? '00' : '05',
        processingFee: isSuccess ? parseFloat((payment.amount * 0.029).toFixed(2)) : 0
      };

      await this.paymentRepository.update(payment.id, {
        status,
        metadata: updatedMetadata,
        processedAt: new Date()
      });

      if (isSuccess) {
        await this.checkAndUpdateOrderStatus(payment.order.id);
      }

      logger.info('Payment processed', {
        paymentId: payment.id,
        status,
        orderId: payment.order.id,
        gatewayResponse: updatedMetadata.gatewayResponse
      });

    } catch (error) {
      const errorMetadata: PaymentMetadata = {
        ...payment.metadata,
        error: error.message,
        processedAt: new Date().toISOString(),
        gatewayResponse: 'ERROR'
      };

      await this.paymentRepository.update(payment.id, {
        status: 'FAILED',
        metadata: errorMetadata,
        processedAt: new Date()
      });

      logger.error('Payment processing failed', {
        paymentId: payment.id,
        error: error.message
      });
    }
  }

  private async checkAndUpdateOrderStatus(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments']
    });

    if (!order) return;

    const totalPaid = order.payments
      ?.filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

    const orderTotal = parseFloat(order.total.toString());

    // Si el total pagado es igual o mayor al total de la orden, marcar como pagada
    if (totalPaid >= orderTotal) {
      await this.orderRepository.update(orderId, { status: 'PAID' });
      
      logger.info('Order marked as paid', {
        orderId,
        totalPaid,
        orderTotal
      });
    }
  }

  // Métodos de búsqueda y filtrado
  async findByOrder(orderId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { order: { id: orderId } },
      relations: ['order'],
      select: {
        id: true,
        transactionId: true,
        amount: true,
        method: true,
        status: true,
        metadata: true,
        processedAt: true,
        order: {
          id: true,
          orderNumber: true,
          total: true,
          status: true
        }
      },
      order: { processedAt: 'DESC' }
    });
  }

  async findByStatus(status: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { status: status as any },
      relations: ['order', 'order.user'],
      select: {
        id: true,
        transactionId: true,
        amount: true,
        method: true,
        status: true,
        processedAt: true,
        order: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          user: {
            id: true,
            email: true
          }
        }
      },
      order: { processedAt: 'DESC' }
    });
  }

  async findByMethod(method: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { method: method as any },
      relations: ['order', 'order.user'],
      select: {
        id: true,
        transactionId: true,
        amount: true,
        method: true,
        status: true,
        processedAt: true,
        order: {
          id: true,
          orderNumber: true,
          total: true,
          user: {
            id: true,
            email: true
          }
        }
      },
      order: { processedAt: 'DESC' }
    });
  }

  async findByUser(userId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { order: { user: { id: userId } } },
      relations: ['order', 'order.user'],
      select: {
        id: true,
        transactionId: true,
        amount: true,
        method: true,
        status: true,
        processedAt: true,
        order: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          user: {
            id: true,
            email: true
          }
        }
      },
      order: { processedAt: 'DESC' }
    });
  }

  async searchPayments(searchTerm: string): Promise<Payment[]> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .where('payment.transactionId LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('order.orderNumber LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.email LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('payment.processedAt', 'DESC')
      .getMany();
  }

  async getPaymentStatistics(): Promise<any> {
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalRevenue,
      paymentsToday,
      paymentsByMethod,
      averagePaymentAmount,
      recentPayments
    ] = await Promise.all([
      // Total de pagos
      this.paymentRepository.count(),
      
      // Pagos por estado
      this.paymentRepository.count({ where: { status: 'COMPLETED' } }),
      this.paymentRepository.count({ where: { status: 'PENDING' } }),
      this.paymentRepository.count({ where: { status: 'FAILED' } }),
      
      // Revenue total
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: 'COMPLETED' })
        .getRawOne(),
      
      // Pagos de hoy
      this.paymentRepository
        .createQueryBuilder('payment')
        .where('DATE(payment.processedAt) = CURDATE()')
        .getCount(),
      
      // Pagos por método
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('payment.method', 'method')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: 'COMPLETED' })
        .groupBy('payment.method')
        .getRawMany(),
      
      // Promedio de monto por pago
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('AVG(payment.amount)', 'average')
        .where('payment.status = :status', { status: 'COMPLETED' })
        .getRawOne(),
      
      // Pagos recientes (últimos 5)
      this.paymentRepository.find({
        relations: ['order', 'order.user'],
        select: {
          id: true,
          transactionId: true,
          amount: true,
          method: true,
          status: true,
          processedAt: true,
          order: {
            orderNumber: true,
            user: { email: true }
          }
        },
        order: { processedAt: 'DESC' },
        take: 5
      })
    ]);

    // Procesar estadísticas por método
    const methodStats = {};
    paymentsByMethod.forEach(item => {
      methodStats[item.method] = {
        count: parseInt(item.count),
        total: parseFloat(item.total || '0'),
        percentage: totalPayments > 0 ? ((parseInt(item.count) / completedPayments) * 100).toFixed(2) : 0
      };
    });

    // Calcular tasa de éxito
    const successRate = totalPayments > 0 ? ((completedPayments / totalPayments) * 100).toFixed(2) : 0;
    
    // Calcular fees totales (estimado 2.9% por transacción)
    const estimatedFees = parseFloat(totalRevenue?.total || '0') * 0.029;

    return {
      overview: {
        total: totalPayments,
        successRate: parseFloat(successRate || '0'),
        averageAmount: parseFloat(averagePaymentAmount?.average || '0'),
        totalFees: parseFloat(estimatedFees.toFixed(2))
      },
      byStatus: {
        completed: completedPayments,
        pending: pendingPayments,
        failed: failedPayments,
      },
      revenue: {
        total: parseFloat(totalRevenue?.total || '0'),
        currency: 'USD',
        fees: parseFloat(estimatedFees.toFixed(2)),
        net: parseFloat((parseFloat(totalRevenue?.total || '0') - estimatedFees).toFixed(2))
      },
      activity: {
        today: paymentsToday,
        recent: recentPayments
      },
      byMethod: methodStats,
      trends: {
        // Aquí se pueden agregar tendencias temporales si es necesario
        last7Days: await this.getPaymentTrends(7),
        last30Days: await this.getPaymentTrends(30)
      }
    };
  }

  private async getPaymentTrends(days: number): Promise<any> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('DATE(payment.processedAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .where('payment.status = :status', { status: 'COMPLETED' })
      .andWhere('payment.processedAt >= DATE_SUB(NOW(), INTERVAL :days DAY)', { days })
      .groupBy('DATE(payment.processedAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map(item => ({
      date: item.date,
      count: parseInt(item.count),
      amount: parseFloat(item.amount || '0')
    }));
  }

  // Método para procesar reembolsos
  async processRefund(paymentId: number, refundAmount?: number): Promise<void> {
    const payment = await this.findOne(paymentId);

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Solo se pueden reembolsar pagos completados');
    }

    const amountToRefund = refundAmount || parseFloat(payment.amount.toString());

    if (amountToRefund > parseFloat(payment.amount.toString())) {
      throw new BadRequestException('El monto del reembolso no puede ser mayor al monto del pago');
    }

    // Verificar reembolsos previos
    const currentRefunds = payment.metadata?.refunds || [];
    const totalPreviouslyRefunded = currentRefunds.reduce((sum, refund) => sum + refund.amount, 0);
    const availableForRefund = parseFloat(payment.amount.toString()) - totalPreviouslyRefunded;

    if (amountToRefund > availableForRefund) {
      throw new BadRequestException(
        `Solo se pueden reembolsar $${availableForRefund.toFixed(2)} de este pago`
      );
    }

    // Simular procesamiento del reembolso con el gateway
    try {
      // Simular delay del gateway
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simular respuesta del gateway (98% éxito)
      const isSuccess = Math.random() > 0.02;

      if (!isSuccess) {
        throw new BadRequestException('El gateway de pago rechazó el reembolso');
      }

      // Actualizar metadata del pago original con información del reembolso
      const updatedMetadata: PaymentMetadata = {
        ...payment.metadata,
        refunds: [
          ...currentRefunds,
          {
            amount: amountToRefund,
            processedAt: new Date().toISOString(),
            gatewayRefundId: `REF-${Date.now()}`
          }
        ]
      };

      await this.paymentRepository.update(paymentId, {
        metadata: updatedMetadata
      });

      logger.info('Refund processed successfully', {
        paymentId,
        originalAmount: payment.amount,
        refundAmount: amountToRefund,
        availableForRefund: availableForRefund - amountToRefund
      });

    } catch (error) {
      logger.error('Refund processing failed', {
        paymentId,
        refundAmount: amountToRefund,
        error: error.message
      });
      throw error;
    }
  }

  // Método para verificar el estado de un pago con el gateway
  async verifyPaymentStatus(paymentId: number): Promise<any> {
    const payment = await this.findOne(paymentId);
    
    // Simular consulta al gateway de pago
    // En un caso real, aquí se consultaría el estado real con el gateway
    
    const gatewayStatus = {
      transactionId: payment.transactionId,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      gatewayResponse: payment.metadata?.gatewayResponse || 'UNKNOWN',
      lastChecked: new Date().toISOString()
    };

    logger.info('Payment status verified', {
      paymentId,
      gatewayStatus: gatewayStatus.status
    });

    return gatewayStatus;
  }

  // Método para reenviar webhook de confirmación
  async resendWebhook(paymentId: number): Promise<void> {
    const payment = await this.findOne(paymentId);
    
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Solo se pueden reenviar webhooks para pagos completados');
    }

    // Simular reenvío de webhook
    // En un caso real, aquí se reenviaría la notificación
    
    logger.info('Webhook resent', {
      paymentId,
      transactionId: payment.transactionId,
      orderNumber: payment.order.orderNumber
    });
  }
}