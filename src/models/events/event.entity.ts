import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { EventSchedule } from './event-schedule.entity';
import { TicketType } from './ticket-type.entity';
import { Venue } from '../core/venue.entity';
import { Media } from '../core/media.entity';
import { EventSeating } from './event-seating.entity';
import { EventMetadata } from './event-metadata.entity';

export enum EventType {
  CONCERT = 'CONCERT',
  CINEMA = 'CINEMA',
  TRANSPORT = 'TRANSPORT',
  SPORTS = 'SPORTS',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column( {type: 'enum', enum: EventType })
  type: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  status: string; // 'DRAFT', 'PUBLISHED', 'CANCELLED'

  @ManyToOne(() => Venue, venue => venue.events)
  venue: Venue;

  @OneToMany(() => EventSchedule, schedule => schedule.event)
  schedules: EventSchedule[];

  @OneToMany(() => TicketType, ticketType => ticketType.event)
  ticketTypes: TicketType[];

  @OneToMany(() => Media, media => media.event)
  mediaItems: Media[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => EventSeating, eventSeating => eventSeating.event)
  seating: EventSeating[];

   @OneToMany(() => EventMetadata, metadata => metadata.event)
  metadata: EventMetadata[];
}
