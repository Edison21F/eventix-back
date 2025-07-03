// src/sales/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../models/sales/order.entity';
import { OrderItem } from '../../models/sales/order-item.entity';
import { User } from '../../models/core/user.entity';
import { TicketType } from '../../models/events/ticket-type.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, UpdateOrderDto } from './dto/update-order.dto';
import { logger } from '../../config/logging.config';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: createOrderDto.userId }
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${createOrderDto.userId} no encontrado`);
    }

    // Verificar que todos los ticket types existen
    const ticketTypeIds = createOrderDto.items.map(item => item.ticketTypeId);
    const ticketTypes = await this.ticketTypeRepository.findByIds(ticketTypeIds);

    if (ticketTypes.length !== ticketTypeIds.length) {
      throw new BadRequestException('Algunos tipos de ticket no existen');
    }

    // Calcular totales
    let subtotal = 0;
    const validatedItems: Array<{
      ticketTypeId: number;
      quantity: number;
      unitPrice: number;
      ticketDetails?: { seatNumber?: string; eventDate?: Date };
      totalPrice: number;
      ticketType: TicketType;
    }> = [];

    for (const itemDto of createOrderDto.items) {
      const ticketType = ticketTypes.find(tt => tt.id === itemDto.ticketTypeId);

      if (!ticketType || !ticketType.isActive) {
        throw new BadRequestException(`Tipo de ticket ${itemDto.ticketTypeId} no está disponible`);
      }

      if (ticketType.quantityAvailable < itemDto.quantity) {
        throw new BadRequestException(`No hay suficientes tickets disponibles para ${ticketType.name}`);
      }

      const totalPrice = itemDto.unitPrice * itemDto.quantity;
      subtotal += totalPrice;

      validatedItems.push({
        ...itemDto,
        totalPrice,
        ticketType
      });
    }

    // Calcular impuestos (ejemplo: 12% IVA)
    const taxes = subtotal * 0.12;
    const total = subtotal + taxes;

    // Generar número de orden único
    const orderNumber = await this.generateOrderNumber();

    // Crear la orden
    const order = this.orderRepository.create({
      orderNumber,
      user,
      subtotal,
      taxes,
      total,
      status: 'PENDING',
      notes: createOrderDto.notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Crear items de la orden
    const orderItems = validatedItems.map(item =>
      this.orderItemRepository.create({
        order: savedOrder,
        ticketType: item.ticketType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        ticketDetails: item.ticketDetails,
      })
    );

    await this.orderItemRepository.save(orderItems);

    // Actualizar cantidad disponible de tickets
    for (const item of validatedItems) {
      await this.ticketTypeRepository.update(
        item.ticketTypeId,
        { quantityAvailable: () => `quantityAvailable - ${item.quantity}` }
      );
    }

    logger.info('Order created successfully', {
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      userId: user.id,
      total: savedOrder.total
    });

    return this.findOne(savedOrder.id);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: [
        'user',
        'items',
        'items.ticketType',
        'items.ticketType.event',
        'payments',
        'refunds'
      ],
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        taxes: true,
        total: true,
        status: true,
        createdAt: true,
        notes: true,
        user: {
          id: true,
          email: true,
        },
        items: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          ticketDetails: true,
          ticketType: {
            id: true,
            name: true,
            price: true,
            currency: true,
            event: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        payments: {
          id: true,
          transactionId: true,
          amount: true,
          method: true,
          status: true,
          processedAt: true
        },
        refunds: {
          id: true,
          amount: true,
          reason: true,
          status: true,
          processedAt: true
        }
      },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.ticketType',
        'items.ticketType.event',
        'items.ticketType.event.venue',
        'payments',
        'refunds',
        'refunds.originalPayment'
      ],
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        taxes: true,
        total: true,
        status: true,
        createdAt: true,
        notes: true,
        user: {
          id: true,
          email: true,
        },
        items: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          ticketDetails: true,
          ticketType: {
            id: true,
            name: true,
            price: true,
            currency: true,
            event: {
              id: true,
              name: true,
              type: true,
              description: true,
              venue: {
                id: true,
                name: true,
                address: true
              }
            }
          }
        },
        payments: {
          id: true,
          transactionId: true,
          amount: true,
          method: true,
          status: true,
          metadata: true,
          processedAt: true
        },
        refunds: {
          id: true,
          amount: true,
          reason: true,
          status: true,
          notes: true,
          processedAt: true,
          originalPayment: {
            id: true,
            transactionId: true,
            method: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Validaciones de negocio
    if (updateOrderDto.status) {
      if (order.status === 'PAID' && updateOrderDto.status === 'PENDING') {
        throw new BadRequestException('No se puede cambiar una orden pagada a pendiente');
      }
      if (order.status === 'CANCELLED' && updateOrderDto.status !== 'CANCELLED') {
        throw new BadRequestException('No se puede modificar una orden cancelada');
      }
    }

    // Solo permitir actualización de status y notes
    const allowedUpdates = {
      status: updateOrderDto.status,
      notes: updateOrderDto.notes,
    };

    // Filtrar valores undefined
    const filteredUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await this.orderRepository.update(id, filteredUpdates);
    }

    // Si se cancela la orden, restaurar stock
    if (updateOrderDto.status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await this.restoreStock(order);
    }

    logger.info('Order updated successfully', {
      orderId: id,
      changes: filteredUpdates
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);

    if (order.status === 'PAID') {
      throw new BadRequestException('No se puede eliminar una orden que ha sido pagada');
    }

    // Restaurar stock si la orden estaba pendiente
    if (order.status === 'PENDING') {
      await this.restoreStock(order);
    }

    // Eliminar items de la orden
    await this.orderItemRepository.delete({ order: { id } });

    // Eliminar la orden
    await this.orderRepository.delete(id);

    logger.info('Order deleted successfully', { orderId: id });
  }

  // Métodos auxiliares
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Buscar el último número de orden del mes actual
    const lastOrder = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :pattern', { pattern: `ORD-${year}${month}-%` })
      .orderBy('order.orderNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `ORD-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
  }

  private async restoreStock(order: Order): Promise<void> {
    for (const item of order.items) {
      await this.ticketTypeRepository.update(
        item.ticketType.id,
        { quantityAvailable: () => `quantityAvailable + ${item.quantity}` }
      );
    }

    logger.info('Stock restored for cancelled order', {
      orderId: order.id,
      itemsCount: order.items.length
    });
  }

  // Métodos de búsqueda y filtrado
  async findByUser(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.ticketType', 'items.ticketType.event', 'payments'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status },
      relations: ['user', 'items', 'items.ticketType'],
      order: { createdAt: 'DESC' }
    });
  }

  async searchOrders(searchTerm: string): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.ticketType', 'ticketType')
      .leftJoinAndSelect('ticketType.event', 'event')
      .where('order.orderNumber LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('user.email LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('event.name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async getOrderStatistics(): Promise<any> {
    const [
      totalOrders,
      pendingOrders,
      paidOrders,
      cancelledOrders,
      totalRevenue,
      ordersToday
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { status: 'PENDING' } }),
      this.orderRepository.count({ where: { status: 'PAID' } }),
      this.orderRepository.count({ where: { status: 'CANCELLED' } }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'total')
        .where('order.status = :status', { status: 'PAID' })
        .getRawOne(),
      this.orderRepository
        .createQueryBuilder('order')
        .where('DATE(order.createdAt) = CURDATE()')
        .getCount()
    ]);

    return {
      total: totalOrders,
      byStatus: {
        pending: pendingOrders,
        paid: paidOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        total: parseFloat(totalRevenue?.total || '0'),
        currency: 'USD'
      },
      today: ordersToday
    };
  }
}