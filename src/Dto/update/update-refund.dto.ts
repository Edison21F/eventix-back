import { PartialType } from '@nestjs/mapped-types';
import { CreateRefundDto, RefundStatus } from '../create/create-refund.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateRefundDto extends PartialType(CreateRefundDto) {
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;
}