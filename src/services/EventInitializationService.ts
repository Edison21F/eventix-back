import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventType } from '../models/events/event.entity';
import { EventSchedule } from '../models/events/event-schedule.entity';
import { TicketType } from '../models/events/ticket-type.entity';
import { EventMetadata } from '../models/events/event-metadata.entity';
import { Media, MediaType } from '../models/core/media.entity';
import { Venue } from '../models/core/venue.entity';
import { logger } from '../config/logging.config';

@Injectable()
export class EventInitializationService implements OnModuleInit {
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

  async onModuleInit() {
    try {
      await this.initializeVenues();
      await this.initializeEvents();
      logger.info('✅ Event initialization completed successfully');
    } catch (error) {
      logger.error('❌ Error initializing events', {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  private async initializeVenues(): Promise<void> {
    logger.info('🏢 Initializing venues...');

    const defaultVenues = [
      {
        name: 'Teatro Nacional Sucre',
        address: 'Plaza del Teatro, Centro Histórico, Quito, Ecuador',
        location: { lat: -0.2201641, lng: -78.5123274 },
        capacity: 800,
        facilities: ['Aire acondicionado', 'Parqueadero', 'Cafetería', 'Acceso para discapacitados']
      },
      {
        name: 'Coliseo Rumiñahui',
        address: 'Av. General Rumiñahui, Quito, Ecuador',
        location: { lat: -0.2295314, lng: -78.5249065 },
        capacity: 15000,
        facilities: ['Parqueadero', 'Seguridad 24/7', 'Múltiples entradas', 'Zonas VIP']
      },
      {
        name: 'Casa de la Cultura',
        address: 'Av. 12 de Octubre y Patria, Quito, Ecuador',
        location: { lat: -0.2024263, lng: -78.4906413 },
        capacity: 500,
        facilities: ['Biblioteca', 'Museo', 'Galería de arte', 'Sala de conferencias']
      },
      {
        name: 'Multicines El Recreo',
        address: 'Centro Comercial El Recreo, Quito, Ecuador',
        location: { lat: -0.2576058, lng: -78.5228973 },
        capacity: 2500,
        facilities: ['Múltiples salas', 'IMAX', '4DX', 'Cafetería', 'Parqueadero']
      },
      {
        name: 'Terminal Terrestre Quitumbe',
        address: 'Av. Morán Valverde, Quitumbe, Quito, Ecuador',
        location: { lat: -0.2984685, lng: -78.5505981 },
        capacity: 5000,
        facilities: ['Terminal de buses', 'Comercios', 'Restaurantes', 'WiFi gratuito']
      },
      {
        name: 'Estadio Olímpico Atahualpa',
        address: 'Av. 6 de Diciembre, Quito, Ecuador',
        location: { lat: -0.1807123, lng: -78.4869152 },
        capacity: 40000,
        facilities: ['Cancha de fútbol', 'Pista de atletismo', 'Graderías techadas', 'Iluminación profesional']
      }
    ];

    for (const venueData of defaultVenues) {
      const existingVenue = await this.venueRepository.findOne({
        where: { name: venueData.name }
      });

      if (!existingVenue) {
        const venue = this.venueRepository.create(venueData);
        await this.venueRepository.save(venue);
        logger.info(`Created venue: ${venue.name}`);
      }
    }
  }

  private async initializeEvents(): Promise<void> {
    logger.info('🎭 Initializing events...');

    // Obtener venues para asociar a los eventos
    const venues = await this.venueRepository.find();
    const venueMap = venues.reduce((map, venue) => {
      map[venue.name] = venue;
      return map;
    }, {} as Record<string, Venue>);

    const defaultEvents = [
      // EVENTOS DE CONCIERTO
      {
        name: 'Jesse & Joy - Tour Ecuador 2024',
        type: EventType.CONCERT,
        description: 'Jesse & Joy regresan a Ecuador con su tour más emotivo. Una noche llena de sus mejores éxitos y nuevas canciones.',
        status: 'PUBLISHED',
        venue: venueMap['Coliseo Rumiñahui'],
        schedules: [
          {
            startTime: new Date('2024-08-15T20:00:00Z'),
            endTime: new Date('2024-08-15T23:00:00Z'),
            isActive: true
          }
        ],
        ticketTypes: [
          { name: 'General', price: 45.00, currency: 'USD', quantityAvailable: 8000 },
          { name: 'VIP', price: 120.00, currency: 'USD', quantityAvailable: 500 },
          { name: 'Palco', price: 200.00, currency: 'USD', quantityAvailable: 100 }
        ],
        metadata: [
          { key: 'genre', value: 'Pop Latino', dataType: 'string' },
          { key: 'duration', value: '180', dataType: 'number' },
          { key: 'age_restriction', value: 'false', dataType: 'boolean' }
        ],
        mediaUrls: [
          'https://example.com/jesse-joy-poster.jpg',
          'https://example.com/jesse-joy-video.mp4'
        ]
      },
      {
        name: 'Nicko Nogués en Concierto',
        type: EventType.CONCERT,
        description: 'El cantautor ecuatoriano presenta su nuevo álbum en una noche íntima en el Teatro Nacional.',
        status: 'PUBLISHED',
        venue: venueMap['Teatro Nacional Sucre'],
        schedules: [
          {
            startTime: new Date('2024-07-20T19:30:00Z'),
            endTime: new Date('2024-07-20T22:00:00Z'),
            isActive: true
          }
        ],
        ticketTypes: [
          { name: 'Platea', price: 35.00, currency: 'USD', quantityAvailable: 400 },
          { name: 'Balcón', price: 25.00, currency: 'USD', quantityAvailable: 300 },
          { name: 'Palco', price: 80.00, currency: 'USD', quantityAvailable: 100 }
        ],
        metadata: [
          { key: 'genre', value: 'Folk Ecuatoriano', dataType: 'string' },
          { key: 'acoustic_show', value: 'true', dataType: 'boolean' }
        ]
      },

      // EVENTOS DE CINE
      {
        name: 'Estreno: Spider-Man: Across the Spider-Verse',
        type: EventType.CINEMA,
        description: 'El esperado estreno de la nueva película de Spider-Man en versión animada. Disponible en IMAX y 4DX.',
        status: 'PUBLISHED',
        venue: venueMap['Multicines El Recreo'],
        schedules: [
          {
            startTime: new Date('2024-07-18T14:00:00Z'),
            endTime: new Date('2024-07-18T16:30:00Z'),
            isActive: true
          },
          {
            startTime: new Date('2024-07-18T17:00:00Z'),
            endTime: new Date('2024-07-18T19:30:00Z'),
            isActive: true
          },
          {
            startTime: new Date('2024-07-18T20:00:00Z'),
            endTime: new Date('2024-07-18T22:30:00Z'),
            isActive: true
          }
        ],
        ticketTypes: [
          { name: 'Sala Regular', price: 6.50, currency: 'USD', quantityAvailable: 200 },
          { name: 'IMAX', price: 12.00, currency: 'USD', quantityAvailable: 300 },
          { name: '4DX', price: 15.00, currency: 'USD', quantityAvailable: 100 }
        ],
        metadata: [
          { key: 'genre', value: 'Animación/Acción', dataType: 'string' },
          { key: 'duration_minutes', value: '140', dataType: 'number' },
          { key: 'rating', value: 'PG', dataType: 'string' },
          { key: '3d_available', value: 'true', dataType: 'boolean' }
        ]
      },
      {
        name: 'Festival de Cine Ecuatoriano',
        type: EventType.CINEMA,
        description: 'Muestra del mejor cine nacional con cortometrajes y largometrajes de directores ecuatorianos.',
        status: 'PUBLISHED',
        venue: venueMap['Casa de la Cultura'],
        schedules: [
          {
            startTime: new Date('2024-08-01T18:00:00Z'),
            endTime: new Date('2024-08-01T22:00:00Z'),
            isActive: true
          }
        ],
        ticketTypes: [
          { name: 'Entrada General', price: 5.00, currency: 'USD', quantityAvailable: 450 },
          { name: 'Estudiantes', price: 2.50, currency: 'USD', quantityAvailable: 50 }
        ],
        metadata: [
          { key: 'festival_type', value: 'Nacional', dataType: 'string' },
          { key: 'films_count', value: '8', dataType: 'number' }
        ]
      },

      // EVENTOS DE TRANSPORTE
      {
        name: 'Quito - Guayaquil Express',
        type: EventType.TRANSPORT,
        description: 'Servicio de transporte express entre Quito y Guayaquil con múltiples horarios diarios.',
        status: 'PUBLISHED',
        venue: venueMap['Terminal Terrestre Quitumbe'],
        schedules: [
          {
            startTime: new Date('2024-07-15T06:00:00Z'),
            endTime: new Date('2024-07-15T14:00:00Z'),
            isActive: true
          },
          {
            startTime: new Date('2024-07-15T10:00:00Z'),
            endTime: new Date('2024-07-15T18:00:00Z'),
            isActive: true
          },
          {
            startTime: new Date('2024-07-15T14:00:00Z'),
            endTime: new Date('2024-07-15T22:00:00Z'),
            isActive: true
          },
          {
            startTime: new Date('2024-07-15T22:00:00Z'),
            endTime: new Date('2024-07-16T06:00:00Z'),
            isActive: true
          }
        ],
        ticketTypes: [
          { name: 'Económico', price: 12.50, currency: 'USD', quantityAvailable: 40 },
          { name: 'Ejecutivo', price: 18.00, currency: 'USD', quantityAvailable: 20 },
          { name: 'VIP', price: 25.00, currency: 'USD', quantityAvailable: 12 }
        ],
        metadata: [
          { key: 'route_distance_km', value: '420', dataType: 'number' },
          { key: 'estimated_duration_hours', value: '8', dataType: 'number' },
          { key: 'stops_count', value: '3', dataType: 'number' },
          { key: 'wifi_available', value: 'true', dataType: 'boolean' },
          { key: 'ac_available', value: 'true', dataType: 'boolean' }
        ]
      },
      {
        name: 'Tour a Otavalo - Mercado Indígena',
        type: EventType.TRANSPORT,
        description: 'Excursión de un día al famoso mercado indígena de Otavalo, incluyendo transporte y guía.',
        status: 'PUBLISHED',
        venue: venueMap['Terminal Terrestre Quitumbe'],
        schedules: [
          {
            startTime: new Date('2024-07-21T07:00:00Z'),
            endTime: new Date('2024-07-21T19:00:00Z'),
            isActive: true
          }
        ],
        ticketTypes: [
          { name: 'Tour Completo', price: 35.00, currency: 'USD', quantityAvailable: 45 },
          { name: 'Solo Transporte', price: 20.00, currency: 'USD', quantityAvailable: 10 }
        ],
        metadata: [
          { key: 'includes_guide', value: 'true', dataType: 'boolean' },
          { key: 'includes_lunch', value: 'true', dataType: 'boolean' },
          { key: 'tour_type', value: 'Cultural', dataType: 'string' }
        ]
      },

      // EVENTOS DEPORTIVOS
      {
        name: 'Liga de Quito vs Barcelona SC',
        type: EventType.SPORTS,
        description: 'Clásico del fútbol ecuatoriano. Liga de Quito recibe a Barcelona SC en el Estadio Olímpico Atahualpa.',
        status: 'PUBLISHED',
        venue: venueMap['Estadio Olímpico Atahualpa'],
        schedules: [
          {
            startTime: new Date('2024-07-28T16:00:00Z'),
            endTime: new Date('2024-07-28T18:00:00Z'),
            isActive: true
          }
        ],
        ticketTypes: [
          { name: 'General Norte', price: 8.00, currency: 'USD', quantityAvailable: 15000 },
          { name: 'General Sur', price: 8.00, currency: 'USD', quantityAvailable: 15000 },
          { name: 'Preferencia', price: 20.00, currency: 'USD', quantityAvailable: 8000 },
          { name: 'Palco', price: 50.00, currency: 'USD', quantityAvailable: 2000 }
        ],
        metadata: [
          { key: 'championship', value: 'Liga Pro Ecuador', dataType: 'string' },
          { key: 'matchday', value: '15', dataType: 'number' },
          { key: 'home_team', value: 'Liga de Quito', dataType: 'string' },
          { key: 'away_team', value: 'Barcelona SC', dataType: 'string' },
          { key: 'is_classic', value: 'true', dataType: 'boolean' }
        ]
      },

      // EVENTOS EN BORRADOR
      {
        name: 'Mau y Ricky - Tour 2024',
        type: EventType.CONCERT,
        description: 'El dúo venezolano llega a Ecuador con su esperado tour mundial.',
        status: 'DRAFT',
        venue: venueMap['Coliseo Rumiñahui'],
        schedules: [
          {
            startTime: new Date('2024-09-15T20:00:00Z'),
            endTime: new Date('2024-09-15T23:00:00Z'),
            isActive: true
          }
        ],
        ticketTypes: [
          { name: 'General', price: 55.00, currency: 'USD', quantityAvailable: 10000 },
          { name: 'VIP', price: 150.00, currency: 'USD', quantityAvailable: 1000 }
        ],
        metadata: [
          { key: 'genre', value: 'Reggaeton/Pop', dataType: 'string' },
          { key: 'presale_date', value: '2024-08-01', dataType: 'date' }
        ]
      }
    ];

    for (const eventData of defaultEvents) {
      const existingEvent = await this.eventRepository.findOne({
        where: { name: eventData.name }
      });

      if (!existingEvent && eventData.venue) {
        // Crear el evento principal
        const event = this.eventRepository.create({
          name: eventData.name,
          type: eventData.type,
          description: eventData.description,
          status: eventData.status,
          venue: eventData.venue,
        });

        const savedEvent = await this.eventRepository.save(event);

        // Crear schedules
        if (eventData.schedules) {
          const eventSchedules = eventData.schedules.map(schedule => 
            this.eventScheduleRepository.create({
              event: savedEvent,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isActive: schedule.isActive,
            })
          );
          await this.eventScheduleRepository.save(eventSchedules);
        }

        // Crear ticket types
        if (eventData.ticketTypes) {
          const ticketTypes = eventData.ticketTypes.map(ticketType => 
            this.ticketTypeRepository.create({
              event: savedEvent,
              name: ticketType.name,
              price: ticketType.price,
              currency: ticketType.currency,
              quantityAvailable: ticketType.quantityAvailable,
              isActive: true,
            })
          );
          await this.ticketTypeRepository.save(ticketTypes);
        }

        // Crear metadata
        if (eventData.metadata) {
          const metadata = eventData.metadata.map(meta => 
            this.eventMetadataRepository.create({
              event: savedEvent,
              key: meta.key,
              value: meta.value,
              dataType: meta.dataType,
            })
          );
          await this.eventMetadataRepository.save(metadata);
        }

        // Crear media items
        if (eventData.mediaUrls) {
          const mediaItems = eventData.mediaUrls.map(url => 
            this.mediaRepository.create({
              event: savedEvent,
              url: url,
              type: this.getMediaTypeFromUrl(url),
              altText: `Media para evento ${savedEvent.name}`,
            })
          );
          await this.mediaRepository.save(mediaItems);
        }

        logger.info(`Created event: ${savedEvent.name} (${savedEvent.type})`);
      } else if (!eventData.venue) {
        logger.warn(`Skipping event "${eventData.name}" - venue not found`);
      }
    }
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

  // Método público para inicializar datos manualmente
  async initializeTestData(): Promise<void> {
    logger.info('🚀 Manual initialization of test data started...');
    await this.initializeVenues();
    await this.initializeEvents();
    logger.info('✅ Manual initialization completed');
  }

  // Método para limpiar todos los eventos de prueba
  async clearTestData(): Promise<void> {
    logger.info('🧹 Clearing test data...');
    
    // Eliminar en orden correcto debido a las foreign keys
    await this.mediaRepository.delete({});
    await this.eventMetadataRepository.delete({});
    await this.ticketTypeRepository.delete({});
    await this.eventScheduleRepository.delete({});
    await this.eventRepository.delete({});
    await this.venueRepository.delete({});
    
    logger.info('✅ Test data cleared successfully');
  }

  // Método para obtener estadísticas de inicialización
  async getInitializationStats(): Promise<any> {
    const [
      totalVenues,
      totalEvents,
      totalSchedules,
      totalTicketTypes,
      totalMetadata,
      totalMedia
    ] = await Promise.all([
      this.venueRepository.count(),
      this.eventRepository.count(),
      this.eventScheduleRepository.count(),
      this.ticketTypeRepository.count(),
      this.eventMetadataRepository.count(),
      this.mediaRepository.count()
    ]);

    return {
      venues: totalVenues,
      events: totalEvents,
      schedules: totalSchedules,
      ticketTypes: totalTicketTypes,
      metadata: totalMetadata,
      media: totalMedia,
      lastUpdate: new Date()
    };
  }
}