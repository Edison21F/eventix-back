import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Concert } from './concert.entity';

@Entity()
export class FanExperience {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Concert, concert => concert.fanExperiences)
  concert: Concert;

  @Column()
  name: string; // "Meet & Greet", "Backstage Tour"

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  capacity: number;

  @Column()
  durationMinutes: number;

  @Column('json')
  schedule: {
    startTime: Date;
    endTime: Date;
    location: string;
  }[];

  @Column('json', { nullable: true })
  requirements?: string[]; // ["VIP Ticket", "Age 18+"]
}
