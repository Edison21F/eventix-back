import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from '../services/orders.service';
import { OrdersController } from '../controllers/orders.controller';
import { Order } from '../models/sales/order.entity';
import { OrderItem } from '../models/sales/order-item.entity';
import { User } from '../models/core/user.entity';
import { TicketType } from '../models/events/ticket-type.entity';
import { UsersModule } from 'src/modules/users.module';
import { Payment } from 'src/models/sales/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, User, TicketType]),
    UsersModule,
    Payment
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}