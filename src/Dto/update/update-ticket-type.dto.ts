import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketTypeDto } from '../create/create-ticket-type.dto';

export class UpdateTicketTypeDto extends PartialType(CreateTicketTypeDto) {}
