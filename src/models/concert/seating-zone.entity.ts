import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Concert } from './concert.entity';
import { Seat } from '../events/seat.entity';

@Entity()
export class SeatingZone {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Concert, concert => concert.seatingZones)
  concert: Concert;

  @Column()
  name: string; // "Golden Circle", "Floor Seating"

  @Column()
  capacity: number;

  @Column('json')
  accessRequirements: string[]; // ["VIP Wristband"]

  @OneToMany(() => Seat, seat => seat.zone)
  seats: Seat[];

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number;
}
