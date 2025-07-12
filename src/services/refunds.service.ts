import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from '../models/sales/refund.entity';
import { Order } from '../models/sales/order.entity';
import { Payment } from '../models/sales/payment.entity';
import { CreateRefundDto } from '../Dto/create/create-refund.dto';
import { UpdateRefundDto } from '../Dto/update/update-refund.dto';
import { logger } from '../config/logging.config';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async create(createRefundDto: CreateRefundDto): Promise<Refund> {
    // Verificar que la orden existe
    const order = await this.orderRepository.findOne({
      where: { id: createRefundDto.orderId },
      relations: ['payments', 'refunds']
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${createRefundDto.orderId} no encontrada`);
    }

    // Verificar que el pago original existe
    const originalPayment = await this.paymentRepository.findOne({
      where: { id: createRefundDto.originalPaymentId }
    });

    if (!originalPayment) {
      throw new NotFoundException(`Pago con ID ${createRefundDto.originalPaymentId} no encontrado`);
    }

    // Validaciones de negocio
    if (originalPayment.status !== 'COMPLETED') {
      throw new BadRequestException('Solo se pueden reembolsar pagos completados');
    }

    // Calcular total ya reembolsado
    const totalRefunded = order.refunds
      ?.filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;

    const maxRefundAmount = parseFloat(originalPayment.amount.toString()) - totalRefunded;

    if (createRefundDto.amount > maxRefundAmount) {
      throw new BadRequestException(
        `El monto del reembolso (${createRefundDto.amount}) excede el monto disponible para reembolso (${maxRefundAmount})`
      );
    }

    // Crear el reembolso
    const refund = this.refundRepository.create({
      order,
      originalPayment,
      amount: createRefundDto.amount,
      reason: createRefundDto.reason,
      status: 'PENDING',
      notes: createRefundDto.notes,
    });

    const savedRefund = await this.refundRepository.save(refund);

    // Procesar el reembolso
    await this.processRefund(savedRefund);

    logger.info('Refund created successfully', {
      refundId: savedRefund.id,
      orderId: order.id,
      amount: savedRefund.amount,
      reason: savedRefund.reason
    });

    return this.findOne(savedRefund.id);
  }

  async findAll(): Promise<Refund[]> {
    return this.refundRepository.find({
      relations: ['order', 'order.user', 'originalPayment'],
      order: { processedAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id },
      relations: ['order', 'order.user', 'originalPayment']
    });

    if (!refund) {
      throw new NotFoundException(`Reembolso con ID ${id} no encontrado`);
    }

    return refund;
  }

  async update(id: number, updateRefundDto: UpdateRefundDto): Promise<Refund> {
    const refund = await this.findOne(id);

    if (refund.status === 'COMPLETED' && updateRefundDto.status !== 'COMPLETED') {
      throw new BadRequestException('No se puede cambiar el estado de un reembolso completado');
    }

    await this.refundRepository.update(id, updateRefundDto);

    logger.info('Refund updated successfully', { refundId: id });

    return this.findOne(id);
  }

  private async processRefund(refund: Refund): Promise<void> {
    try {
      // Simular procesamiento del reembolso
      // En un caso real, aquí se haría la llamada al gateway de pago

      // Simular un delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 200));

      // Simular éxito del reembolso (98% de éxito)
      const isSuccess = Math.random() > 0.02;

      const status = isSuccess ? 'COMPLETED' : 'FAILED';

      await this.refundRepository.update(refund.id, {
        status,
        processedAt: new Date()
      });

      // Si el reembolso es exitoso, verificar si la orden debe marcarse como reembolsada
      if (isSuccess) {
        await this.checkAndUpdateOrderRefundStatus(refund.order.id);
      }

      logger.info('Refund processed', {
        refundId: refund.id,
        status,
        orderId: refund.order.id
      });

    } catch (error) {
      await this.refundRepository.update(refund.id, {
        status: 'FAILED',
        processedAt: new Date()
      });

      logger.error('Refund processing failed', {
        refundId: refund.id,
        error: error.message
      });
    }
  }

  private async checkAndUpdateOrderRefundStatus(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments', 'refunds']
    });

    if (!order) return;

    const totalPaid = order.payments
      ?.filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

    const totalRefunded = order.refunds
      ?.filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;

    // Si todo lo pagado ha sido reembolsado, marcar la orden como reembolsada
    if (totalRefunded >= totalPaid && totalPaid > 0) {
      await this.orderRepository.update(orderId, { status: 'REFUNDED' });
      
      logger.info('Order marked as refunded', {
        orderId,
        totalPaid,
        totalRefunded
      });
    }
  }

  async findByOrder(orderId: number): Promise<Refund[]> {
    return this.refundRepository.find({
      where: { order: { id: orderId } },
      relations: ['originalPayment'],
      order: { processedAt: 'DESC' }
    });
  }

  async getRefundStatistics(): Promise<any> {
    const [
      totalRefunds,
      completedRefunds,
      pendingRefunds,
      failedRefunds,
      totalRefundAmount
    ] = await Promise.all([
      this.refundRepository.count(),
      this.refundRepository.count({ where: { status: 'COMPLETED' } }),
      this.refundRepository.count({ where: { status: 'PENDING' } }),
      this.refundRepository.count({ where: { status: 'FAILED' } }),
      this.refundRepository
        .createQueryBuilder('refund')
        .select('SUM(refund.amount)', 'total')
        .where('refund.status = :status', { status: 'COMPLETED' })
        .getRawOne()
    ]);

    return {
      total: totalRefunds,
      byStatus: {
        completed: completedRefunds,
        pending: pendingRefunds,
        failed: failedRefunds,
      },
      totalAmount: parseFloat(totalRefundAmount?.total || '0')
    };
  }
}