import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Payment } from './payment.entity';

@Entity()
export class Refund {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, order => order.refunds)
  order: Order;

  @ManyToOne(() => Payment)
  originalPayment: Payment;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  reason: 'CANCELLATION' | 'CUSTOMER_REQUEST' | 'EVENT_CANCELLED';

  @Column()
  status: 'PENDING' | 'COMPLETED' | 'FAILED';

  @Column('json', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  processedAt: Date;
}
