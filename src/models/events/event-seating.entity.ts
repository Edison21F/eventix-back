import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';
import { SeatMap } from './seat-map.entity';

@Entity()
export class EventSeating {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, event => event.seating)
  event: Event;

  @ManyToOne(() => SeatMap, seatMap => seatMap.events)
  seatMap: SeatMap;

  @Column('json')
  configuration: any; // Configuración de asientos para el evento

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
