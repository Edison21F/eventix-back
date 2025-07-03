import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TicketType } from './ticket-type.entity';

export enum AdjustmentType {
  DISCOUNT = 'DISCOUNT',
  SURCHARGE = 'SURCHARGE',
}

@Entity()
export class PricingRule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TicketType, ticketType => ticketType.pricingRules)
  ticketType: TicketType;

  @Column()
  name: string; // Ej: "Early Bird Discount"

  @Column('json')
  conditions: {
    minTickets: number;
    maxTickets: number;
    validFrom: Date;
    validUntil: Date;
  };

  @Column('decimal', { precision: 10, scale: 2 })
  adjustmentValue: number; // Descuento o incremento

  @Column({
    type: 'enum',
    enum: AdjustmentType,
  })
  adjustmentType: AdjustmentType; // 'DISCOUNT' o 'SURCHARGE'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
