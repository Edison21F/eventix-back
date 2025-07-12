// src/sales/orders/orders.controller.ts - CORREGIDO
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
  Query,
  HttpStatus,
  HttpCode,
  BadRequestException
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../Dto/create/create-order.dto';
import { UpdateOrderDto, OrderStatus } from '../Dto/update/update-order.dto';
import { JwtAuthGuard } from '../lib/guards/jwt-auth.guard';
import { RolesGuard } from '../lib/guards/roles.guard';
import { PermissionsGuard } from '../lib/guards/permissions.guard';
import { Roles } from '../lib/decorators/roles.decorator';
import { RequirePermissions } from '../lib/decorators/permissions.decorator';
import { CurrentUser } from '../lib/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermissions('create_order')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: any
  ) {
    // Si no se especifica userId, usar el del usuario autenticado
    if (!createOrderDto.userId) {
      createOrderDto.userId = user.userId;
    }

    // Solo admins y sales managers pueden crear órdenes para otros usuarios
    if (createOrderDto.userId !== user.userId) {
      if (!user.roles?.includes('admin') && !user.roles?.includes('sales_manager')) {
        createOrderDto.userId = user.userId; // Forzar a usar su propio ID
      }
    }

    const order = await this.ordersService.create(createOrderDto);
    return {
      message: 'Orden creada exitosamente',
      order,
      createdBy: user.email
    };
  }

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager', 'user_manager')
  @RequirePermissions('read_order')
  async findAll(
    @Query('status') status?: string,
    @Query('user') userId?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any
  ) {
    // Si es un customer, solo puede ver sus propias órdenes
    if (user.roles?.includes('customer') && !user.roles?.includes('admin')) {
      return {
        message: 'Mis órdenes',
        orders: await this.ordersService.findByUser(user.userId)
      };
    }

    if (search) {
      return {
        message: 'Resultados de búsqueda de órdenes',
        orders: await this.ordersService.searchOrders(search)
      };
    }

    if (status) {
      // Validar que el status sea válido
      if (!this.isValidOrderStatus(status)) {
        throw new BadRequestException(`Estado inválido: ${status}. Estados válidos: PENDING, PAID, CANCELLED, REFUNDED`);
      }
      return {
        message: `Órdenes con estado ${status}`,
        orders: await this.ordersService.findByStatus(status as OrderStatus)
      };
    }

    if (userId) {
      return {
        message: `Órdenes del usuario ${userId}`,
        orders: await this.ordersService.findByUser(userId)
      };
    }

    return {
      message: 'Lista de todas las órdenes',
      orders: await this.ordersService.findAll()
    };
  }

  @Get('statistics')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('view_reports')
  async getStatistics() {
    const statistics = await this.ordersService.getOrderStatistics();
    return {
      message: 'Estadísticas de órdenes',
      statistics
    };
  }

  @Get('my-orders')
  @RequirePermissions('read_order')
  async getMyOrders(@CurrentUser() user: any) {
    const orders = await this.ordersService.findByUser(user.userId);
    return {
      message: 'Mis órdenes',
      orders
    };
  }

  @Get('statuses')
  @RequirePermissions('read_order')
  getOrderStatuses() {
    return {
      message: 'Estados de órdenes disponibles',
      statuses: [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'PAID', label: 'Pagada' },
        { value: 'CANCELLED', label: 'Cancelada' },
        { value: 'REFUNDED', label: 'Reembolsada' }
      ]
    };
  }

  @Get(':id')
  @RequirePermissions('read_order')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    const order = await this.ordersService.findOne(id);

    // Verificar que el usuario puede ver esta orden
    if (user.roles?.includes('customer') && !user.roles?.includes('admin')) {
      if (order.user.id !== user.userId) {
        return {
          message: 'No tienes permisos para ver esta orden',
          statusCode: 403
        };
      }
    }

    return {
      message: 'Detalles de la orden',
      order
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('update_order')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: any
  ) {
    const order = await this.ordersService.update(id, updateOrderDto);
    return {
      message: 'Orden actualizada exitosamente',
      order,
      updatedBy: user.email
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('delete_order')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    await this.ordersService.remove(id);
    return {
      message: 'Orden eliminada exitosamente',
      deletedBy: user.email
    };
  }

  @Patch(':id/cancel')
  @RequirePermissions('update_order')
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    const order = await this.ordersService.findOne(id);

    // Verificar permisos: el dueño de la orden o admins/sales managers pueden cancelar
    if (user.roles?.includes('customer') && !user.roles?.includes('admin')) {
      if (order.user.id !== user.userId) {
        return {
          message: 'No tienes permisos para cancelar esta orden',
          statusCode: 403
        };
      }
    }

    const updatedOrder = await this.ordersService.update(id, { status: OrderStatus.CANCELLED });
    return {
      message: 'Orden cancelada exitosamente',
      order: updatedOrder,
      cancelledBy: user.email
    };
  }

  // Endpoint específico para obtener órdenes por estado
  @Get('by-status/:status')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'sales_manager')
  @RequirePermissions('read_order')
  async getOrdersByStatus(@Param('status') status: string) {
    // Validar que el status sea válido
    if (!this.isValidOrderStatus(status)) {
      throw new BadRequestException(`Estado inválido: ${status}. Estados válidos: PENDING, PAID, CANCELLED, REFUNDED`);
    }

    const orders = await this.ordersService.findByStatus(status as OrderStatus);
    return {
      message: `Órdenes con estado ${status}`,
      orders,
      count: orders.length
    };
  }

  // Endpoint para obtener resumen de una orden (datos básicos)
  @Get(':id/summary')
  @RequirePermissions('read_order')
  async getOrderSummary(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    const order = await this.ordersService.findOne(id);

    // Verificar permisos
    if (user.roles?.includes('customer') && !user.roles?.includes('admin')) {
      if (order.user.id !== user.userId) {
        return {
          message: 'No tienes permisos para ver esta orden',
          statusCode: 403
        };
      }
    }

    return {
      message: 'Resumen de la orden',
      summary: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        itemsCount: order.items.length,
        createdAt: order.createdAt,
        user: {
          email: order.user.email
        }
      }
    };
  }

  // Método privado para validar estados de orden
  private isValidOrderStatus(status: string): status is OrderStatus {
    return Object.values(OrderStatus).includes(status as OrderStatus);
  }
}