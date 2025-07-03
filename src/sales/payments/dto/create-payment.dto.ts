import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from 'src/enums/payment-method.enum';



export class CreatePaymentDto {
  @IsNumber()
  orderId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  metadata?: {
    cardLast4?: string;
    paymentGateway?: string;
    fee?: number;
    key?: string; // Permite campos arbitrarios como 'error'
  };

  @IsOptional()
  @IsString()
  transactionId?: string; // Para casos donde el ID viene del gateway externo
}
