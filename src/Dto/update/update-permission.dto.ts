import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from '../create/create-permission.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}