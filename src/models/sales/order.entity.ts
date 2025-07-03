import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { Refund } from './refund.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNumber: string; // Ej: "ORD-2023-0001"

  @ManyToOne(() => User, user => user.orders)
  user: User;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 12, scale: 2 })
  taxes: number;

  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';

  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];

  @OneToMany(() => Payment, payment => payment.order)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  notes?: string;

  @OneToMany(() => Refund, refund => refund.order)
  refunds: Refund[];
}
