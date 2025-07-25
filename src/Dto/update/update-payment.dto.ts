import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from '../create/create-payment.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from '../../lib/enums/payment-status.enum';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}