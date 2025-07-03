import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Artist } from './artist.entity';
import { Concert } from './concert.entity';

@Entity()
export class Tour {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // "World Tour 2024"

  @ManyToOne(() => Artist, artist => artist.tours)
  artist: Artist;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column('json', { nullable: true })
  sponsors?: string[];

  @OneToMany(() => Concert, concert => concert.tour)
  concerts: Concert[];

  @Column({ default: true })
  isActive: boolean;
}
