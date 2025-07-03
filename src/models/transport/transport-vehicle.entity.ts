import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { TransportType } from './transport-type.entity';
import { TransportSchedule } from './transport-schedule.entity';

@Entity()
export class TransportVehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  licensePlate: string;

  @ManyToOne(() => TransportType, type => type.vehicles)
  type: TransportType;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  capacity: number;

  @Column('json')
  features: {
    hasWifi: boolean;
    hasWC: boolean;
    hasAC: boolean;
  };

  @OneToMany(() => TransportSchedule, schedule => schedule.assignedVehicle)
  schedules: TransportSchedule[];

  @Column({ default: 'AVAILABLE' })
  status: 'AVAILABLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}
