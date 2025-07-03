import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../../models/events/event.entity';

export class CreateEventScheduleDto {
  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsString()
  isActive?: boolean = true;
}

export class CreateTicketTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  quantityAvailable: number;

  @IsOptional()
  @IsDateString()
  salesStart?: Date;

  @IsOptional()
  @IsDateString()
  salesEnd?: Date;
}

export class CreateEventMetadataDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsString()
  dataType?: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(EventType)
  type: EventType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string = 'DRAFT';

  @IsNumber()
  venueId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventScheduleDto)
  schedules?: CreateEventScheduleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketTypeDto)
  ticketTypes?: CreateTicketTypeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventMetadataDto)
  metadata?: CreateEventMetadataDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}