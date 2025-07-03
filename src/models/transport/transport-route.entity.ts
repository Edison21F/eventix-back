import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { TransportOperator } from './transport-operator.entity';
import { TransportSchedule } from './transport-schedule.entity';
import { TransportPrice } from './transport-price.entity';

@Entity()
export class TransportRoute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originCity: string;

  @Column()
  destinationCity: string;

  @Column('decimal', { precision: 10, scale: 2 })
  distanceKm: number;

  @Column('json')
  waypoints: {
    city: string;
    stopDurationMinutes: number;
  }[];

  @ManyToOne(() => TransportOperator, operator => operator.routes)
  operator: TransportOperator;

  @OneToMany(() => TransportSchedule, schedule => schedule.route)
  schedules: TransportSchedule[];

  @OneToMany(() => TransportPrice, price => price.route)
  prices: TransportPrice[];

  @Column({ default: true })
  isActive: boolean;
}
