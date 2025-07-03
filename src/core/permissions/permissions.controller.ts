import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('admin')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @Roles('admin', 'user_manager')
  findAll(@Query('category') category?: string, @Query('search') search?: string) {
    if (search) {
      return this.permissionsService.searchPermissions(search);
    }
    if (category) {
      return this.permissionsService.findByCategory(category);
    }
    return this.permissionsService.findAll();
  }

  @Get('categories')
  @Roles('admin', 'user_manager')
  getCategories() {
    return this.permissionsService.getCategories();
  }

  @Get('by-role/:roleId')
  @Roles('admin', 'user_manager')
  getPermissionsByRole(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.permissionsService.getPermissionsByRole(roleId);
  }

  @Get(':id')
  @Roles('admin', 'user_manager')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }

  @Post('bulk')
  @Roles('admin')
  bulkCreate(@Body() permissionsData: CreatePermissionDto[]) {
    return this.permissionsService.bulkCreate(permissionsData);
  }

  @Post('initialize-defaults')
  @Roles('admin')
  initializeDefaults() {
    return this.permissionsService.initializeDefaultPermissions();
  }
}