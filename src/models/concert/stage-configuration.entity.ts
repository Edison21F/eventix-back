import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Concert } from './concert.entity';

@Entity()
export class StageConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Concert, concert => concert.stageConfigurations)
  concert: Concert;

  @Column()
  name: string; // "Main Stage", "B-Stage"

  @Column('decimal', { precision: 8, scale: 2 })
  widthMeters: number;

  @Column('decimal', { precision: 8, scale: 2 })
  depthMeters: number;

  @Column('json')
  specialFeatures: string[]; // ["Pyrotechnics", "LED Wall"]

  @Column('json')
  equipment: {
    name: string;
    quantity: number;
  }[];

  @Column()
  setupTimeHours: number;
}
