import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  ParseIntPipe, 
  Query 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdatePersonalDataDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user_manager')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user_manager')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user_manager')
  searchUsers(
    @Query('term') searchTerm: string,
    @Query('limit') limit?: number
  ) {
    return this.usersService.searchUsers(searchTerm, limit ? +limit : 10);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getUserStatistics() {
    return this.usersService.getUserStatistics();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user_manager')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto
  ) {
    // Los usuarios solo pueden actualizar su propia información personal
    const { roleIds, isActive, emailVerified, ...allowedUpdates } = updateUserDto;
    return this.usersService.update(user.userId, allowedUpdates);
  }

  @Patch('me/personal-data')
  @UseGuards(JwtAuthGuard)
  updateMyPersonalData(
    @CurrentUser() user: any,
    @Body() personalData: UpdatePersonalDataDto
  ) {
    return this.usersService.update(user.userId, { personalData });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user_manager')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.hardDelete(id);
  }

  @Get(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user_manager')
  getUserPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserPermissions(id);
  }

  // Endpoint específico para crear datos personales
  @Post(':id/personal-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user_manager')
  createPersonalData(
    @Param('id', ParseIntPipe) userId: number,
    @Body() personalData: UpdatePersonalDataDto
  ) {
    return this.usersService.update(userId, { personalData });
  }
}