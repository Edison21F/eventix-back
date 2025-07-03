import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TransportVehicle } from './transport-vehicle.entity';
import { TransportPrice } from './transport-price.entity';

@Entity()
export class TransportType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // "Premium Bus", "Economy Train"

  @Column()
  category: 'BUS' | 'TRAIN' | 'AIRPLANE' | 'FERRY';

  @Column('json')
  amenities: string[]; // ['Wifi', 'AC', 'Toilet']

  @Column({ nullable: true })
  seatingDiagramUrl?: string;

  @OneToMany(() => TransportVehicle, vehicle => vehicle.type)
  vehicles: TransportVehicle[];

  @OneToMany(() => TransportPrice, price => price.transportType)
  prices: TransportPrice[];
}
