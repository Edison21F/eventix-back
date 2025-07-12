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
  HttpCode
} from '@nestjs/common';
import { EventsService } from '../services/events.service';
import { CreateEventDto } from '../Dto/create/create-event.dto';
import { UpdateEventDto } from '../Dto/update/update-event.dto';
import { JwtAuthGuard } from '../lib/guards/jwt-auth.guard';
import { RolesGuard } from '../lib/guards/roles.guard';
import { PermissionsGuard } from '../lib/guards/permissions.guard';
import { Roles } from '../lib/decorators/roles.decorator';
import { RequirePermissions } from '../lib/decorators/permissions.decorator';
import { CurrentUser } from '../lib/decorators/current-user.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'event_manager')
  @RequirePermissions('create_event')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: any
  ) {
    const event = await this.eventsService.create(createEventDto);
    return {
      message: 'Evento creado exitosamente',
      event,
      createdBy: user.email
    };
  }

  @Get()
  @RequirePermissions('read_event')
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('venue') venueId?: number,
    @Query('search') search?: string
  ) {
    if (search) {
      return {
        message: 'Resultados de búsqueda',
        events: await this.eventsService.searchEvents(search)
      };
    }

    if (type) {
      return {
        message: `Eventos de tipo ${type}`,
        events: await this.eventsService.findByType(type)
      };
    }

    if (status) {
      return {
        message: `Eventos con estatus ${status}`,
        events: await this.eventsService.findByStatus(status)
      };
    }

    if (venueId) {
      return {
        message: `Eventos en venue ${venueId}`,
        events: await this.eventsService.findByVenue(venueId)
      };
    }

    return {
      message: 'Lista de todos los eventos',
      events: await this.eventsService.findAll()
    };
  }

  @Get('statistics')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'event_manager')
  @RequirePermissions('view_reports')
  async getStatistics() {
    const statistics = await this.eventsService.getEventStatistics();
    return {
      message: 'Estadísticas de eventos',
      statistics
    };
  }

  @Get('types')
  @RequirePermissions('read_event')
  getEventTypes() {
    return {
      message: 'Tipos de eventos disponibles',
      types: [
        { value: 'CONCERT', label: 'Concierto' },
        { value: 'CINEMA', label: 'Cine' },
        { value: 'TRANSPORT', label: 'Transporte' },
        { value: 'SPORTS', label: 'Deportes' }
      ]
    };
  }

  @Get('statuses')
  @RequirePermissions('read_event')
  getEventStatuses() {
    return {
      message: 'Estados de eventos disponibles',
      statuses: [
        { value: 'DRAFT', label: 'Borrador' },
        { value: 'PUBLISHED', label: 'Publicado' },
        { value: 'CANCELLED', label: 'Cancelado' },
        { value: 'COMPLETED', label: 'Completado' }
      ]
    };
  }

  @Get(':id')
  @RequirePermissions('read_event')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventsService.findOne(id);
    return {
      message: 'Detalles del evento',
      event
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'event_manager')
  @RequirePermissions('update_event')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: any
  ) {
    const event = await this.eventsService.update(id, updateEventDto);
    return {
      message: 'Evento actualizado exitosamente',
      event,
      updatedBy: user.email
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'event_manager')
  @RequirePermissions('delete_event')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    await this.eventsService.remove(id);
    return {
      message: 'Evento eliminado exitosamente',
      deletedBy: user.email
    };
  }

  // Endpoints específicos para gestión de schedules
  @Get(':id/schedules')
  @RequirePermissions('read_event')
  async getEventSchedules(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventsService.findOne(id);
    return {
      message: 'Horarios del evento',
      schedules: event.schedules
    };
  }

  // Endpoints específicos para gestión de ticket types
  @Get(':id/ticket-types')
  @RequirePermissions('read_event')
  async getEventTicketTypes(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventsService.findOne(id);
    return {
      message: 'Tipos de ticket del evento',
      ticketTypes: event.ticketTypes
    };
  }

  // Endpoints específicos para gestión de metadata
  @Get(':id/metadata')
  @RequirePermissions('read_event')
  async getEventMetadata(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventsService.findOne(id);
    return {
      message: 'Metadata del evento',
      metadata: event.metadata
    };
  }

  // Endpoints específicos para gestión de media
  @Get(':id/media')
  @RequirePermissions('read_event')
  async getEventMedia(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventsService.findOne(id);
    return {
      message: 'Media del evento',
      media: event.mediaItems
    };
  }

  // Endpoint para cambiar el status del evento
  @Patch(':id/status')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'event_manager')
  @RequirePermissions('update_event')
  async updateEventStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @CurrentUser() user: any
  ) {
    const event = await this.eventsService.update(id, { status });
    return {
      message: `Estado del evento cambiado a ${status}`,
      event,
      updatedBy: user.email
    };
  }

  // Endpoint público para consultar eventos (sin autenticación)
  @Get('public/list')
  async getPublicEvents(
    @Query('type') type?: string,
    @Query('limit') limit?: number
  ) {
    const events = type 
      ? await this.eventsService.findByType(type)
      : await this.eventsService.findByStatus('PUBLISHED');

    const limitedEvents = limit ? events.slice(0, limit) : events;

    return {
      message: 'Eventos públicos disponibles',
      events: limitedEvents.map(event => ({
        id: event.id,
        name: event.name,
        type: event.type,
        description: event.description,
        venue: {
          name: event.venue.name,
          address: event.venue.address,
          capacity: event.venue.capacity
        },
        schedules: event.schedules?.filter(s => s.isActive).map(s => ({
          startTime: s.startTime,
          endTime: s.endTime
        })),
        ticketTypes: event.ticketTypes?.filter(t => t.isActive).map(t => ({
          name: t.name,
          price: t.price,
          currency: t.currency,
          quantityAvailable: t.quantityAvailable
        }))
      }))
    };
  }
}