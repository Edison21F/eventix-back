import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from '../create/create-report.dto';

export class UpdateReportDto extends PartialType(CreateReportDto) {}
