import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  removeScheduleIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  removeTicketTypeIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  removeMetadataIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  removeMediaIds?: number[];
}