import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../../models/sales/payment.entity';
import { Order } from '../../models/sales/order.entity';
import { UsersModule } from 'src/core/users/users.module';
import { SalesInitializationService } from 'src/services/SalesInitializationService';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order]),
    UsersModule
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}