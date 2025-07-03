import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdatePersonalDataDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin', 'user_manager')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin', 'user_manager')
  findAll() {
    return this.usersService.findAll();
  }

  

  @Get('me')
  getMyProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.userId);
  }

  @Get(':id')
  @Roles('admin', 'user_manager')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto
  ) {
    // Los usuarios solo pueden actualizar su propia información personal
    const { roleIds, isActive, emailVerified, ...allowedUpdates } = updateUserDto;
    return this.usersService.update(user.userId, allowedUpdates);
  }

  @Patch('me/personal-data')
  updateMyPersonalData(
    @CurrentUser() user: any,
    @Body() personalData: UpdatePersonalDataDto
  ) {
    return this.usersService.update(user.userId, { personalData });
  }

  @Patch(':id')
  @Roles('admin', 'user_manager')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  
  @Get(':id/permissions')
  @Roles('admin', 'user_manager')
  getUserPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserPermissions(id);
  }

  
}