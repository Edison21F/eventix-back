import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TransportRoute } from './transport-route.entity';

@Entity()
export class TransportOperator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  legalName: string;

  @Column()
  commercialName: string; // "City Linx", "National Rail"

  @Column('json')
  contact: {
    phone: string;
    emergencyPhone: string;
    email: string;
  };

  @Column()
  countryCode: string;

  @OneToMany(() => TransportRoute, route => route.operator)
  routes: TransportRoute[];

  @Column({ default: true })
  isActive: boolean;
}
