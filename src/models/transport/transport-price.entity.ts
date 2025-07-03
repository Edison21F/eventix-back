import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { TransportRoute } from './transport-route.entity';
import { TransportType } from './transport-type.entity';

@Entity()
export class TransportPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TransportRoute, route => route.prices)
  route: TransportRoute;

  @ManyToOne(() => TransportType, type => type.prices)
  transportType: TransportType;

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number;

  @Column('json')
  seasonalPrices: {
    fromDate: Date;
    toDate: Date;
    multiplier: number;
  }[];

  @Column('json')
  classPrices: {
    class: 'ECONOMY' | 'BUSINESS' | 'FIRST';
    price: number;
  }[];

  @Column({ default: true })
  isActive: boolean;
}
