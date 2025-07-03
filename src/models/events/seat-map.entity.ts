import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Seat } from './seat.entity';
import { EventSeating } from './event-seating.entity';

@Entity()
export class SeatMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  venueId: number; // FK a Venue

  @Column()
  name: string; // Ej: "Main Hall"

  @Column('json')
  schema: any; // Estructura del mapa de asientos

  @OneToMany(() => Seat, seat => seat.seatMap)
  seats: Seat[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => EventSeating, eventSeating => eventSeating.seatMap)
  events: EventSeating[];
}
