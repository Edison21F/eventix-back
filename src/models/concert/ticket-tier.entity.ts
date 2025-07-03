import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Concert } from './concert.entity';

@Entity()
export class TicketTier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // "VIP Front Row", "General Admission"

  @ManyToOne(() => Concert, concert => concert.ticketTiers)
  concert: Concert;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  currency: string;

  @Column()
  quantityAvailable: number;

  @Column('json', { nullable: true })
  benefits?: string[]; // ["Meet & Greet", "Exclusive Merch"]
}
