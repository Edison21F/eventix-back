// src/services/SalesInitializationService.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../models/sales/order.entity';
import { OrderItem } from '../models/sales/order-item.entity';
import { Payment } from '../models/sales/payment.entity';
import { Refund } from '../models/sales/refund.entity';
import { User } from '../models/core/user.entity';
import { TicketType } from '../models/events/ticket-type.entity';
import { Event } from '../models/events/event.entity';
import { logger } from '../config/logging.config';
import { OrderStatus } from '../Dto/update/update-order.dto';

interface TestOrderData {
    userId: number;
    items: {
        ticketTypeId: number;
        quantity: number;
        unitPrice: number;
        ticketDetails?: any;
    }[];
    status: OrderStatus;
    notes?: string;
    shouldHavePayment?: boolean;
    shouldHaveRefund?: boolean;
    paymentMethod?: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO';
    paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
}

@Injectable()
export class SalesInitializationService implements OnModuleInit {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(Refund)
        private refundRepository: Repository<Refund>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(TicketType)
        private ticketTypeRepository: Repository<TicketType>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
    ) { }

    async onModuleInit() {
        try {
            const existingOrders = await this.orderRepository.count();
            if (existingOrders === 0) {
                await this.initializeSalesData();
                logger.info('✅ Sales data initialization completed successfully');
            } else {
                logger.info('📊 Sales data already exists, skipping initialization');
            }
        } catch (error) {
            logger.error('❌ Error initializing sales data', {
                message: error.message,
                stack: error.stack,
            });
        }
    }

    async initializeSalesData(): Promise<void> {
        logger.info('🛒 Initializing sales data...');

        // Verificar que existan usuarios y ticket types
        const users = await this.userRepository.find({ take: 10 });
        const ticketTypes = await this.ticketTypeRepository.find({
            relations: ['event'],
            take: 20
        });

        if (users.length === 0) {
            logger.warn('⚠️ No users found, cannot create orders');
            return;
        }

        if (ticketTypes.length === 0) {
            logger.warn('⚠️ No ticket types found, cannot create orders');
            return;
        }

        // Crear órdenes de prueba
        await this.createTestOrders(users, ticketTypes);

        logger.info('✅ Sales data initialization completed');
    }

    private async createTestOrders(users: User[], ticketTypes: TicketType[]): Promise<void> {
        const testOrders: TestOrderData[] = [
            // Órdenes pagadas exitosas
            {
                userId: users[0]?.id,
                items: [
                    { ticketTypeId: ticketTypes[0]?.id, quantity: 2, unitPrice: ticketTypes[0]?.price || 45.00 },
                    { ticketTypeId: ticketTypes[1]?.id, quantity: 1, unitPrice: ticketTypes[1]?.price || 120.00 }
                ],
                status: OrderStatus.PAID,
                notes: 'Orden completada - Concierto Jesse & Joy',
                shouldHavePayment: true,
                paymentMethod: 'CREDIT_CARD',
                paymentStatus: 'COMPLETED'
            },
            {
                userId: users[1]?.id,
                items: [
                    { ticketTypeId: ticketTypes[2]?.id, quantity: 4, unitPrice: ticketTypes[2]?.price || 35.00 }
                ],
                status: OrderStatus.PAID,
                notes: 'Compra familiar - Teatro Nacional',
                shouldHavePayment: true,
                paymentMethod: 'PAYPAL',
                paymentStatus: 'COMPLETED'
            },
            {
                userId: users[2]?.id,
                items: [
                    { ticketTypeId: ticketTypes[3]?.id, quantity: 1, unitPrice: ticketTypes[3]?.price || 15.00 }
                ],
                status: OrderStatus.PAID,
                notes: 'Entrada individual cine',
                shouldHavePayment: true,
                paymentMethod: 'CREDIT_CARD',
                paymentStatus: 'COMPLETED'
            },

            // Órdenes pendientes
            {
                userId: users[0]?.id,
                items: [
                    { ticketTypeId: ticketTypes[4]?.id || ticketTypes[0]?.id, quantity: 3, unitPrice: ticketTypes[4]?.price || ticketTypes[0]?.price || 25.00 }
                ],
                status: OrderStatus.PENDING,
                notes: 'Orden pendiente de pago',
                shouldHavePayment: true,
                paymentMethod: 'BANK_TRANSFER',
                paymentStatus: 'PENDING'
            },
            {
                userId: users[3]?.id || users[0]?.id,
                items: [
                    { ticketTypeId: ticketTypes[5]?.id || ticketTypes[1]?.id, quantity: 2, unitPrice: ticketTypes[5]?.price || ticketTypes[1]?.price || 55.00 }
                ],
                status: OrderStatus.PENDING,
                notes: 'Esperando confirmación de pago',
                shouldHavePayment: false
            },

            // Órdenes canceladas
            {
                userId: users[1]?.id,
                items: [
                    { ticketTypeId: ticketTypes[6]?.id || ticketTypes[2]?.id, quantity: 1, unitPrice: ticketTypes[6]?.price || ticketTypes[2]?.price || 80.00 }
                ],
                status: OrderStatus.CANCELLED,
                notes: 'Orden cancelada por el usuario',
                shouldHavePayment: false
            },
            {
                userId: users[2]?.id,
                items: [
                    { ticketTypeId: ticketTypes[7]?.id || ticketTypes[0]?.id, quantity: 5, unitPrice: ticketTypes[7]?.price || ticketTypes[0]?.price || 12.50 }
                ],
                status: OrderStatus.CANCELLED,
                notes: 'Cancelado - evento pospuesto',
                shouldHavePayment: true,
                paymentMethod: 'CREDIT_CARD',
                paymentStatus: 'FAILED'
            },

            // Órdenes con reembolsos
            {
                userId: users[0]?.id,
                items: [
                    { ticketTypeId: ticketTypes[8]?.id || ticketTypes[1]?.id, quantity: 2, unitPrice: ticketTypes[8]?.price || ticketTypes[1]?.price || 75.00 }
                ],
                status: OrderStatus.REFUNDED,
                notes: 'Orden reembolsada - evento cancelado',
                shouldHavePayment: true,
                shouldHaveRefund: true,
                paymentMethod: 'PAYPAL',
                paymentStatus: 'COMPLETED'
            },

            // Órdenes de diferentes tipos de eventos
            {
                userId: users[4]?.id || users[0]?.id,
                items: [
                    {
                        ticketTypeId: ticketTypes[9]?.id || ticketTypes[0]?.id,
                        quantity: 1,
                        unitPrice: ticketTypes[9]?.price || ticketTypes[0]?.price || 20.00,
                        ticketDetails: { seatNumber: 'A-15', eventDate: new Date('2024-08-01T18:00:00Z') }
                    }
                ],
                status: OrderStatus.PAID,
                notes: 'Boleto de transporte Quito-Guayaquil',
                shouldHavePayment: true,
                paymentMethod: 'CREDIT_CARD',
                paymentStatus: 'COMPLETED'
            },

            // Órdenes grandes (múltiples items)
            {
                userId: users[1]?.id,
                items: [
                    { ticketTypeId: ticketTypes[0]?.id, quantity: 2, unitPrice: ticketTypes[0]?.price || 45.00 },
                    { ticketTypeId: ticketTypes[1]?.id, quantity: 2, unitPrice: ticketTypes[1]?.price || 120.00 },
                    { ticketTypeId: ticketTypes[2]?.id, quantity: 1, unitPrice: ticketTypes[2]?.price || 200.00 }
                ],
                status: OrderStatus.PAID,
                notes: 'Compra grupal - mix de tickets',
                shouldHavePayment: true,
                paymentMethod: 'CRYPTO',
                paymentStatus: 'COMPLETED'
            },

            // Más órdenes variadas para estadísticas
            ...this.generateRandomOrders(users, ticketTypes, 15)
        ];

        // Crear las órdenes
        for (const orderData of testOrders) {
            try {
                await this.createTestOrder(orderData);
            } catch (error) {
                logger.error('Error creating test order', {
                    orderData,
                    error: error.message
                });
            }
        }
    }

    private generateRandomOrders(users: User[], ticketTypes: TicketType[], count: number): TestOrderData[] {
        const orders: TestOrderData[] = [];
        const statuses = [OrderStatus.PAID, OrderStatus.PENDING, OrderStatus.CANCELLED];
        const methods = ['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO'] as const;
        const paymentStatuses = ['PENDING', 'COMPLETED', 'FAILED'] as const;

        for (let i = 0; i < count; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            const randomMethod = methods[Math.floor(Math.random() * methods.length)];
            const randomPaymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

            // Generar entre 1 y 3 items por orden
            const itemCount = Math.floor(Math.random() * 3) + 1;
            const items = [];

            for (let j = 0; j < itemCount; j++) {
                const randomTicketType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
                const quantity = Math.floor(Math.random() * 4) + 1;
                const items: {
                    ticketTypeId: number;
                    quantity: number;
                    unitPrice: number;
                }[] = [];

                items.push({
                    ticketTypeId: randomTicketType.id,
                    quantity,
                    unitPrice: randomTicketType.price || (Math.floor(Math.random() * 100) + 10)
                });
            }

            orders.push({
                userId: randomUser.id,
                items,
                status: randomStatus,
                notes: `Orden generada automáticamente #${i + 1}`,
                shouldHavePayment: randomStatus !== OrderStatus.CANCELLED || Math.random() > 0.5,
                paymentMethod: randomMethod,
                paymentStatus: randomPaymentStatus
            });
        }

        return orders;
    }

    private async createTestOrder(orderData: TestOrderData): Promise<void> {
        // Buscar el usuario
        const user = await this.userRepository.findOne({ where: { id: orderData.userId } });
        if (!user) {
            logger.warn(`User with ID ${orderData.userId} not found`);
            return;
        }

        // Verificar ticket types
        const ticketTypeIds = orderData.items.map(item => item.ticketTypeId);
        const ticketTypes = await this.ticketTypeRepository.findByIds(ticketTypeIds);

        if (ticketTypes.length !== ticketTypeIds.length) {
            logger.warn('Some ticket types not found', { ticketTypeIds, found: ticketTypes.length });
            return;
        }

        // Calcular totales
        let subtotal = 0;
        orderData.items.forEach(item => {
            subtotal += item.unitPrice * item.quantity;
        });

        const taxes = subtotal * 0.12; // 12% IVA
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
            status: orderData.status,
            notes: orderData.notes,
        });

        const savedOrder = await this.orderRepository.save(order);

        // Crear items de la orden
        const orderItems = orderData.items.map(itemData => {
            const ticketType = ticketTypes.find(tt => tt.id === itemData.ticketTypeId);
            return this.orderItemRepository.create({
                order: savedOrder,
                ticketType,
                quantity: itemData.quantity,
                unitPrice: itemData.unitPrice,
                totalPrice: itemData.unitPrice * itemData.quantity,
                ticketDetails: itemData.ticketDetails,
            });
        });

        await this.orderItemRepository.save(orderItems);

        // Crear pago si corresponde
        if (orderData.shouldHavePayment) {
            await this.createTestPayment(savedOrder, orderData);
        }

        // Crear reembolso si corresponde
        if (orderData.shouldHaveRefund && orderData.shouldHavePayment) {
            // Primero buscar el pago para poder reembolsar
            const payment = await this.paymentRepository.findOne({
                where: { order: { id: savedOrder.id } }
            });

            if (payment && payment.status === 'COMPLETED') {
                await this.createTestRefund(savedOrder, payment);
            }
        }

        logger.info(`Created test order: ${savedOrder.orderNumber} (${savedOrder.status})`);
    }

    private async createTestPayment(order: Order, orderData: TestOrderData): Promise<void> {
        const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const payment = this.paymentRepository.create({
            transactionId,
            order,
            amount: order.total,
            method: orderData.paymentMethod || 'CREDIT_CARD',
            status: orderData.paymentStatus || 'COMPLETED',
            metadata: {
                gatewayResponse: orderData.paymentStatus === 'COMPLETED' ? 'SUCCESS' :
                    orderData.paymentStatus === 'FAILED' ? 'DECLINED' : 'PENDING',
                gatewayCode: orderData.paymentStatus === 'COMPLETED' ? '00' : '05',
                processingFee: orderData.paymentStatus === 'COMPLETED' ?
                    parseFloat((order.total * 0.029).toFixed(2)) : 0,
                cardLast4: orderData.paymentMethod === 'CREDIT_CARD' ? '1234' : undefined,
                paymentGateway: 'test_gateway'
            },
            processedAt: new Date()
        });

        await this.paymentRepository.save(payment);
    }

    private async createTestRefund(order: Order, payment: Payment): Promise<void> {
        // Reembolsar parcial o total (50% chance cada uno)
        const isPartialRefund = Math.random() > 0.5;
        const refundAmount = isPartialRefund ?
            parseFloat((payment.amount * 0.5).toFixed(2)) :
            payment.amount;

        const refund = this.refundRepository.create({
            order,
            originalPayment: payment,
            amount: refundAmount,
            reason: 'EVENT_CANCELLED',
            status: 'COMPLETED',
            notes: isPartialRefund ? 'Reembolso parcial por cancelación' : 'Reembolso total',
            processedAt: new Date()
        });

        await this.refundRepository.save(refund);

        // Si es reembolso total, actualizar estado de la orden
        if (!isPartialRefund) {
            await this.orderRepository.update(order.id, { status: OrderStatus.REFUNDED });
        }
    }

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

    // Métodos públicos para gestión manual de datos

    async clearAllSalesData(): Promise<void> {
        logger.info('🧹 Clearing all sales data...');

        // Eliminar en orden correcto debido a las foreign keys
        await this.refundRepository.delete({});
        await this.paymentRepository.delete({});
        await this.orderItemRepository.delete({});
        await this.orderRepository.delete({});

        logger.info('✅ All sales data cleared successfully');
    }

    async initializeManually(): Promise<void> {
        logger.info('🚀 Manual initialization of sales data started...');
        await this.clearAllSalesData();
        await this.initializeSalesData();
        logger.info('✅ Manual sales data initialization completed');
    }

    async getSalesDataStatistics(): Promise<any> {
        const [
            totalOrders,
            totalPayments,
            totalRefunds,
            ordersByStatus,
            paymentsByMethod,
            totalRevenue
        ] = await Promise.all([
            this.orderRepository.count(),
            this.paymentRepository.count(),
            this.refundRepository.count(),
            this.orderRepository
                .createQueryBuilder('order')
                .select('order.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .groupBy('order.status')
                .getRawMany(),
            this.paymentRepository
                .createQueryBuilder('payment')
                .select('payment.method', 'method')
                .addSelect('COUNT(*)', 'count')
                .where('payment.status = :status', { status: 'COMPLETED' })
                .groupBy('payment.method')
                .getRawMany(),
            this.paymentRepository
                .createQueryBuilder('payment')
                .select('SUM(payment.amount)', 'total')
                .where('payment.status = :status', { status: 'COMPLETED' })
                .getRawOne()
        ]);

        return {
            totals: {
                orders: totalOrders,
                payments: totalPayments,
                refunds: totalRefunds,
                revenue: parseFloat(totalRevenue?.total || '0')
            },
            ordersByStatus: ordersByStatus.reduce((acc, item) => {
                acc[item.status] = parseInt(item.count);
                return acc;
            }, {}),
            paymentsByMethod: paymentsByMethod.reduce((acc, item) => {
                acc[item.method] = parseInt(item.count);
                return acc;
            }, {}),
            lastUpdate: new Date()
        };
    }

    async createSampleOrdersForUser(userId: number, count: number = 5): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        const ticketTypes = await this.ticketTypeRepository.find({ take: 10 });
        if (ticketTypes.length === 0) {
            throw new Error('No ticket types available');
        }

        const sampleOrders = this.generateRandomOrders([user], ticketTypes, count);

        for (const orderData of sampleOrders) {
            await this.createTestOrder(orderData);
        }

        logger.info(`Created ${count} sample orders for user ${userId}`);
    }
}