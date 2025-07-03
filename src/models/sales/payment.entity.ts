import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  transactionId: string;

  @ManyToOne(() => Order, order => order.payments)
  order: Order;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  method: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO';

  @Column()
  status: 'PENDING' | 'COMPLETED' | 'FAILED';

  @Column('json', { nullable: true })
  metadata?: {
    cardLast4?: string;
    paymentGateway?: string;
    fee?: number;
  };

  @CreateDateColumn()
  processedAt: Date;
}
