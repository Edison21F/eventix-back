import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';

@Entity()
export class EventSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, event => event.schedules)
  event: Event;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ nullable: true })
  recurrenceRule?: string; // Ej: "FREQ=WEEKLY;BYDAY=MO,WE,FR"

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
