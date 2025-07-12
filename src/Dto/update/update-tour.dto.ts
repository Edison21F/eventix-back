import { PartialType } from '@nestjs/mapped-types';
import { CreateTourDto } from '../create/create-tour.dto';

export class UpdateTourDto extends PartialType(CreateTourDto) {}
