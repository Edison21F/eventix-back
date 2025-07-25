import { Injectable } from '@nestjs/common';
import { CreateTicketTypeDto } from '../Dto/create/create-ticket-type.dto';
import { UpdateTicketTypeDto } from '../Dto/update/update-ticket-type.dto';

@Injectable()
export class TicketTypesService {
  create(createTicketTypeDto: CreateTicketTypeDto) {
    return 'This action adds a new ticketType';
  }

  findAll() {
    return `This action returns all ticketTypes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticketType`;
  }

  update(id: number, updateTicketTypeDto: UpdateTicketTypeDto) {
    return `This action updates a #${id} ticketType`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticketType`;
  }
}
