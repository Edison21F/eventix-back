import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from '../services/roles.service';
import { RolesController } from '../controllers/roles.controller';
import { Role } from '../models/core/role.entity';
import { RolePermission } from '../models/core/role-permission.entity';
import { Permission } from '../models/core/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission, Permission])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}