import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from '../create/create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}