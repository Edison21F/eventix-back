import { Injectable } from '@nestjs/common';
import { CreateConcertDto } from '../Dto/create/create-concert.dto';
import { UpdateConcertDto } from '../Dto/update/update-concert.dto';

@Injectable()
export class ConcertsService {
  create(createConcertDto: CreateConcertDto) {
    return 'This action adds a new concert';
  }

  findAll() {
    return `This action returns all concerts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} concert`;
  }

  update(id: number, updateConcertDto: UpdateConcertDto) {
    return `This action updates a #${id} concert`;
  }

  remove(id: number) {
    return `This action removes a #${id} concert`;
  }
}
