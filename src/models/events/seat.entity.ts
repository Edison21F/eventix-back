import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import { SeatMap } from './seat-map.entity';
import { CinemaRoom } from '../cinema/cinema-room.entity';
import { SeatingZone } from '../concert/seating-zone.entity';

// Enums para tipo y estado del asiento
export enum SeatType {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  ACCESSIBLE = 'ACCESSIBLE',
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  HOLD = 'HOLD',
}

@Entity()
export class Seat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SeatMap, seatMap => seatMap.seats, { nullable: true })
  seatMap: SeatMap;

  @Column()
  label: string; // Ej: "A1", "B2"

  @Column({
    type: 'enum',
    enum: SeatType,
  })
  type: SeatType;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column('json', { nullable: true })
  attributes?: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => CinemaRoom, room => room.seats, { nullable: true })
  room: CinemaRoom;

  @ManyToOne(() => SeatingZone, zone => zone.seats, { nullable: true })
  zone: SeatingZone;
}
