import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { TransportRoute } from './transport-route.entity';
import { TransportVehicle } from './transport-vehicle.entity';

@Entity()
export class TransportSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TransportRoute, route => route.schedules)
  route: TransportRoute;

  @Column()
  departureTime: string; // "08:00"

  @Column()
  arrivalTime: string; // "12:30"

  @Column()
  operatingDays: string; // "1,2,3,4,5" (Mon-Fri)

  @ManyToOne(() => TransportVehicle, { nullable: true })
  assignedVehicle?: TransportVehicle;

  @Column({ default: true })
  isActive: boolean;
}
