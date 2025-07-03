import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SystemLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string; // 'USER_LOGIN', 'EVENT_CREATED'

  @Column()
  entityType: string; // 'User', 'Event'

  @Column({ nullable: true })
  entityId?: number;

  @Column({ nullable: true })
  actorId?: number; // User ID

  @Column('json', { nullable: true })
  metadata?: any;

  @Column('text', { nullable: true })
  ipAddress?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
