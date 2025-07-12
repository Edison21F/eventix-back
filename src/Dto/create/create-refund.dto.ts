import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export enum RefundReason {
  CANCELLATION = 'CANCELLATION',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  EVENT_CANCELLED = 'EVENT_CANCELLED'
}

export enum RefundStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export class CreateRefundDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  originalPaymentId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsEnum(RefundReason)
  reason: RefundReason;

  @IsOptional()
  @IsString()
  notes?: string;
}