// src/sales/refunds/refunds.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { Refund } from '../../models/sales/refund.entity';
import { Order } from '../../models/sales/order.entity';
import { Payment } from '../../models/sales/payment.entity';
import { UsersModule } from 'src/core/users/users.module';

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