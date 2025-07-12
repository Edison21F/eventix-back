import { Injectable } from '@nestjs/common';
import { CreateTourDto } from '../Dto/create/create-tour.dto';
import { UpdateTourDto } from '../Dto/update/update-tour.dto';

@Injectable()
export class ToursService {
  create(createTourDto: CreateTourDto) {
    return 'This action adds a new tour';
  }

  findAll() {
    return `This action returns all tours`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tour`;
  }

  update(id: number, updateTourDto: UpdateTourDto) {
    return `This action updates a #${id} tour`;
  }

  remove(id: number) {
    return `This action removes a #${id} tour`;
  }
}
