import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from '../create/create-schedule.dto';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}
