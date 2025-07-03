import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TicketType } from './ticket-type.entity';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

@Entity()
export class Discount {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TicketType, ticketType => ticketType.discounts)
  ticketType: TicketType;

  @Column()
  code: string; // Código de descuento

  @Column('decimal', { precision: 10, scale: 2 })
  value: number; // Valor del descuento

  @Column({
    type: 'enum',
    enum: DiscountType,
  })
  type: DiscountType; // 'PERCENTAGE' o 'FIXED'

  @Column({ nullable: true })
  usesRemaining?: number; // Cantidad de usos restantes

  @Column({ nullable: true })
  validUntil?: Date; // Fecha de validez

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
