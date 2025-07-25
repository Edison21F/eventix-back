import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  UseGuards, 
  ParseIntPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { RefundsService } from '../services/refunds.service';
import { CreateRefundDto } from '../Dto/create/create-refund.dto';
import { UpdateRefundDto } from '../Dto/update/update-refund.dto';
import { JwtAuthGuard } from '../lib/guards/jwt-auth.guard';
import { RolesGuard } from '../lib/guards/roles.guard';
import { PermissionsGuard } from '../lib/guards/permissions.guard';
import { Roles } from '../lib/decorators/roles.decorator';
import { RequirePermissions } from '../lib/decorators/permissions.decorator';
import { CurrentUser } from '../lib/decorators/current-user.decorator';

@Controller('refunds')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'sales_manager')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @RequirePermissions('process_refund')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createRefundDto: CreateRefundDto,
    @CurrentUser() user: any
  ) {
    const refund = await this.refundsService.create(createRefundDto);
    return {
      message: 'Reembolso creado exitosamente',
      refund,
      createdBy: user.email
    };
  }

  @Get()
  @RequirePermissions('view_reports')
  async findAll() {
    return {
      message: 'Lista de todos los reembolsos',
      refunds: await this.refundsService.findAll()
    };
  }

  @Get('statistics')
  @RequirePermissions('view_reports')
  async getStatistics() {
    const statistics = await this.refundsService.getRefundStatistics();
    return {
      message: 'Estadísticas de reembolsos',
      statistics
    };
  }

  @Get(':id')
  @RequirePermissions('view_reports')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Detalles del reembolso',
      refund: await this.refundsService.findOne(id)
    };
  }

  @Patch(':id')
  @RequirePermissions('process_refund')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRefundDto: UpdateRefundDto,
    @CurrentUser() user: any
  ) {
    const refund = await this.refundsService.update(id, updateRefundDto);
    return {
      message: 'Reembolso actualizado exitosamente',
      refund,
      updatedBy: user.email
    };
  }

  @Get('order/:orderId')
  @RequirePermissions('view_reports')
  async getRefundsByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    const refunds = await this.refundsService.findByOrder(orderId);
    return {
      message: `Reembolsos de la orden ${orderId}`,
      refunds,
      count: refunds.length
    };
  }
}