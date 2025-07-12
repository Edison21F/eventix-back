import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../models/events/event.entity';
import { EventSchedule } from '../models/events/event-schedule.entity';
import { TicketType } from '../models/events/ticket-type.entity';
import { EventMetadata } from '../models/events/event-metadata.entity';
import { Media, MediaType } from '../models/core/media.entity';
import { Venue } from '../models/core/venue.entity';
import { CreateEventDto } from '../Dto/create/create-event.dto';
import { UpdateEventDto } from '../Dto/update/update-event.dto';
import { logger } from '../config/logging.config';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventSchedule)
    private eventScheduleRepository: Repository<EventSchedule>,
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(EventMetadata)
    private eventMetadataRepository: Repository<EventMetadata>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @InjectRepository(Venue)
    private venueRepository: Repository<Venue>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    // Verificar que el venue existe
    const venue = await this.venueRepository.findOne({
      where: { id: createEventDto.venueId }
    });

    if (!venue) {
      throw new NotFoundException(`Venue con ID ${createEventDto.venueId} no encontrado`);
    }

    // Crear el evento principal
    const event = this.eventRepository.create({
      name: createEventDto.name,
      type: createEventDto.type,
      description: createEventDto.description,
      status: createEventDto.status || 'DRAFT',
      venue: venue,
    });

    const savedEvent = await this.eventRepository.save(event);

    // Crear schedules si se proporcionaron
    if (createEventDto.schedules && createEventDto.schedules.length > 0) {
      await this.createEventSchedules(savedEvent, createEventDto.schedules);
    }

    // Crear ticket types si se proporcionaron
    if (createEventDto.ticketTypes && createEventDto.ticketTypes.length > 0) {
      await this.createTicketTypes(savedEvent, createEventDto.ticketTypes);
    }

    // Crear metadata si se proporcionó
    if (createEventDto.metadata && createEventDto.metadata.length > 0) {
      await this.createEventMetadata(savedEvent, createEventDto.metadata);
    }

    // Crear media items si se proporcionaron
    if (createEventDto.mediaUrls && createEventDto.mediaUrls.length > 0) {
      await this.createMediaItems(savedEvent, createEventDto.mediaUrls);
    }

    logger.info('Event created successfully', {
      eventId: savedEvent.id,
      name: savedEvent.name,
      type: savedEvent.type
    });

    return this.findOne(savedEvent.id);
  }

  async findAll(): Promise<Event[]> {
    return this.eventRepository.find({
      relations: [
        'venue',
        'schedules',
        'ticketTypes',
        'metadata',
        'mediaItems'
      ],
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        status: true,
        createdAt: true,
        venue: {
          id: true,
          name: true,
          address: true,
          capacity: true
        },
        schedules: {
          id: true,
          startTime: true,
          endTime: true,
          isActive: true
        },
        ticketTypes: {
          id: true,
          name: true,
          price: true,
          currency: true,
          quantityAvailable: true,
          isActive: true
        },
        metadata: {
          id: true,
          key: true,
          value: true,
          dataType: true
        },
        mediaItems: {
          id: true,
          url: true,
          type: true,
          altText: true
        }
      },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: [
        'venue',
        'schedules',
        'ticketTypes',
        'ticketTypes.pricingRules',
        'ticketTypes.discounts',
        'metadata',
        'mediaItems',
        'seating',
        'seating.seatMap'
      ],
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        status: true,
        createdAt: true,
        venue: {
          id: true,
          name: true,
          address: true,
          location: true,
          capacity: true,
          facilities: true
        },
        schedules: {
          id: true,
          startTime: true,
          endTime: true,
          recurrenceRule: true,
          isActive: true,
          createdAt: true
        },
        ticketTypes: {
          id: true,
          name: true,
          price: true,
          currency: true,
          quantityAvailable: true,
          salesStart: true,
          salesEnd: true,
          isActive: true,
          createdAt: true,
          pricingRules: {
            id: true,
            name: true,
            conditions: true,
            adjustmentValue: true,
            adjustmentType: true
          },
          discounts: {
            id: true,
            code: true,
            value: true,
            type: true,
            usesRemaining: true,
            validUntil: true
          }
        },
        metadata: {
          id: true,
          key: true,
          value: true,
          dataType: true,
          createdAt: true
        },
        mediaItems: {
          id: true,
          url: true,
          type: true,
          altText: true,
          uploadedAt: true
        }
      }
    });

    if (!event) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    // Verificar venue si se está actualizando
    if (updateEventDto.venueId && updateEventDto.venueId !== event.venue.id) {
      const venue = await this.venueRepository.findOne({
        where: { id: updateEventDto.venueId }
      });
      if (!venue) {
        throw new NotFoundException(`Venue con ID ${updateEventDto.venueId} no encontrado`);
      }
    }

    // Actualizar datos básicos del evento
    const { 
      schedules, 
      ticketTypes, 
      metadata, 
      mediaUrls,
      removeScheduleIds,
      removeTicketTypeIds,
      removeMetadataIds,
      removeMediaIds,
      ...eventData 
    } = updateEventDto;

    if (Object.keys(eventData).length > 0) {
      await this.eventRepository.update(id, eventData);
    }

    // Manejar eliminación de schedules
    if (removeScheduleIds && removeScheduleIds.length > 0) {
      await this.eventScheduleRepository.delete({
        id: { $in: removeScheduleIds } as any,
        event: { id }
      });
    }

    // Manejar eliminación de ticket types
    if (removeTicketTypeIds && removeTicketTypeIds.length > 0) {
      await this.ticketTypeRepository.delete({
        id: { $in: removeTicketTypeIds } as any,
        event: { id }
      });
    }

    // Manejar eliminación de metadata
    if (removeMetadataIds && removeMetadataIds.length > 0) {
      await this.eventMetadataRepository.delete({
        id: { $in: removeMetadataIds } as any,
        event: { id }
      });
    }

    // Manejar eliminación de media
    if (removeMediaIds && removeMediaIds.length > 0) {
      await this.mediaRepository.delete({
        id: { $in: removeMediaIds } as any,
        event: { id }
      });
    }

    // Agregar nuevos schedules
    if (schedules && schedules.length > 0) {
      await this.createEventSchedules(event, schedules);
    }

    // Agregar nuevos ticket types
    if (ticketTypes && ticketTypes.length > 0) {
      await this.createTicketTypes(event, ticketTypes);
    }

    // Agregar nueva metadata
    if (metadata && metadata.length > 0) {
      await this.createEventMetadata(event, metadata);
    }

    // Agregar nuevos media items
    if (mediaUrls && mediaUrls.length > 0) {
      await this.createMediaItems(event, mediaUrls);
    }

    logger.info('Event updated successfully', {
      eventId: id,
      updatedFields: Object.keys(eventData)
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);

    // Verificar si el evento puede ser eliminado
    if (event.status === 'PUBLISHED') {
      throw new BadRequestException('No se puede eliminar un evento publicado. Primero cámbialo a borrador o cancelado.');
    }

    // Eliminar relaciones asociadas
    await this.eventScheduleRepository.delete({ event: { id } });
    await this.ticketTypeRepository.delete({ event: { id } });
    await this.eventMetadataRepository.delete({ event: { id } });
    await this.mediaRepository.delete({ event: { id } });

    // Eliminar el evento
    await this.eventRepository.delete(id);

    logger.info('Event deleted successfully', { eventId: id });
  }

  // Métodos auxiliares privados
  private async createEventSchedules(event: Event, schedules: any[]): Promise<void> {
    const eventSchedules = schedules.map(schedule => 
      this.eventScheduleRepository.create({
        event: event,
        startTime: new Date(schedule.startTime),
        endTime: new Date(schedule.endTime),
        recurrenceRule: schedule.recurrenceRule,
        isActive: schedule.isActive !== false,
      })
    );

    await this.eventScheduleRepository.save(eventSchedules);
  }

  private async createTicketTypes(event: Event, ticketTypes: any[]): Promise<void> {
    const eventTicketTypes = ticketTypes.map(ticketType => 
      this.ticketTypeRepository.create({
        event: event,
        name: ticketType.name,
        price: ticketType.price,
        currency: ticketType.currency,
        quantityAvailable: ticketType.quantityAvailable,
        salesStart: ticketType.salesStart ? new Date(ticketType.salesStart) : undefined,
        salesEnd: ticketType.salesEnd ? new Date(ticketType.salesEnd) : undefined,
        isActive: true,
      })
    );

    await this.ticketTypeRepository.save(eventTicketTypes);
  }

  private async createEventMetadata(event: Event, metadata: any[]): Promise<void> {
    const eventMetadata = metadata.map(meta => 
      this.eventMetadataRepository.create({
        event: event,
        key: meta.key,
        value: meta.value,
        dataType: meta.dataType || 'string',
      })
    );

    await this.eventMetadataRepository.save(eventMetadata);
  }

  private async createMediaItems(event: Event, mediaUrls: string[]): Promise<void> {
    const mediaItems = mediaUrls.map(url => 
      this.mediaRepository.create({
        event: event,
        url: url,
        type: this.getMediaTypeFromUrl(url),
        altText: `Media para evento ${event.name}`,
      })
    );

    await this.mediaRepository.save(mediaItems);
  }

  private getMediaTypeFromUrl(url: string): MediaType {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return MediaType.IMAGE;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return MediaType.VIDEO;
    } else {
      return MediaType.DOCUMENT;
    }
  }

  // Métodos adicionales para funcionalidades específicas
  async findByType(type: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { type: type as any },
      relations: ['venue', 'schedules', 'ticketTypes'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { status },
      relations: ['venue', 'schedules', 'ticketTypes'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByVenue(venueId: number): Promise<Event[]> {
    return this.eventRepository.find({
      where: { venue: { id: venueId } },
      relations: ['venue', 'schedules', 'ticketTypes'],
      order: { createdAt: 'DESC' }
    });
  }

  async searchEvents(searchTerm: string): Promise<Event[]> {
    return this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.venue', 'venue')
      .leftJoinAndSelect('event.schedules', 'schedules')
      .leftJoinAndSelect('event.ticketTypes', 'ticketTypes')
      .where('event.name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('event.description LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('venue.name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('event.createdAt', 'DESC')
      .getMany();
  }

  async getEventStatistics(): Promise<any> {
    const [
      totalEvents,
      publishedEvents,
      draftEvents,
      cancelledEvents,
      eventsByType
    ] = await Promise.all([
      this.eventRepository.count(),
      this.eventRepository.count({ where: { status: 'PUBLISHED' } }),
      this.eventRepository.count({ where: { status: 'DRAFT' } }),
      this.eventRepository.count({ where: { status: 'CANCELLED' } }),
      this.eventRepository
        .createQueryBuilder('event')
        .select('event.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.type')
        .getRawMany()
    ]);

    return {
      total: totalEvents,
      byStatus: {
        published: publishedEvents,
        draft: draftEvents,
        cancelled: cancelledEvents,
      },
      byType: eventsByType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {})
    };
  }
}