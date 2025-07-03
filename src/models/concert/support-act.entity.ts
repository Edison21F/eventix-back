import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Concert } from './concert.entity';

@Entity()
export class SupportAct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Concert, concert => concert.supportActs)
  concert: Concert;

  @Column()
  startTime: Date;

  @Column()
  durationMinutes: number;

  @Column({ nullable: true })
  spotifyId?: string;
}
