// src/sales/refunds/refunds.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundsService } from '../services/refunds.service';
import { RefundsController } from '../controllers/refunds.controller';
import { Refund } from '../models/sales/refund.entity';
import { Order } from '../models/sales/order.entity';
import { Payment } from '../models/sales/payment.entity';
import { UsersModule } from 'src/modules/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund, Order, Payment]),
    UsersModule
  ],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}