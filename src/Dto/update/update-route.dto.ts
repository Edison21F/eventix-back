import { PartialType } from '@nestjs/mapped-types';
import { CreateRouteDto } from '../create/create-route.dto';

export class UpdateRouteDto extends PartialType(CreateRouteDto) {}
