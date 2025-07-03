import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Event } from './event.entity';
import { PricingRule } from './pricing-rule.entity';
import { Discount } from './discount.entity';

@Entity()
export class TicketType {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, event => event.ticketTypes)
  event: Event;

  @Column()
  name: string; // Ej: "General Admission", "VIP"

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  currency: string; // Ej: "USD", "EUR"

  @Column()
  quantityAvailable: number;

  @Column({ nullable: true })
  salesStart?: Date;

  @Column({ nullable: true })
  salesEnd?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => PricingRule, pricingRule => pricingRule.ticketType)
  pricingRules: PricingRule[];

  @OneToMany(() => Discount, discount => discount.ticketType)
  discounts: Discount[];
}
