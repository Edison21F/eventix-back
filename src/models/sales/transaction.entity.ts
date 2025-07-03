import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';
import { Order } from './order.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Order, { nullable: true })
  order?: Order;

  @Column()
  type: 'PURCHASE' | 'REFUND' | 'ADJUSTMENT' | 'LOYALTY_POINTS';

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('json')
  details: {
    beforeBalance: number;
    afterBalance: number;
    currency: string;
  };

  @CreateDateColumn()
  timestamp: Date;
}
