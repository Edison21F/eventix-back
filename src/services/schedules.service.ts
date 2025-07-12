import { Injectable } from '@nestjs/common';
import { CreateScheduleDto } from '../Dto/create/create-schedule.dto';
import { UpdateScheduleDto } from '../Dto/update/update-schedule.dto';

@Injectable()
export class SchedulesService {
  create(createScheduleDto: CreateScheduleDto) {
    return 'This action adds a new schedule';
  }

  findAll() {
    return `This action returns all schedules`;
  }

  findOne(id: number) {
    return `This action returns a #${id} schedule`;
  }

  update(id: number, updateScheduleDto: UpdateScheduleDto) {
    return `This action updates a #${id} schedule`;
  }

  remove(id: number) {
    return `This action removes a #${id} schedule`;
  }
}
