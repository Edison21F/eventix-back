import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';
import { Order } from '../sales/order.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column('json')
  personalData: {
    firstName: string;
    lastName: string;
    birthDate?: Date;
    address?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => UserRole, userRole => userRole.user)
  roles: UserRole[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

   @OneToMany(() => Order, order => order.user)
    orders: Order[];

    
}
