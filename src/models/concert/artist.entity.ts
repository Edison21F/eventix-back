import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Tour } from './tour.entity';
import { Concert } from './concert.entity';

@Entity()
export class Artist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('simple-array')
  genres: string[]; // ['Rock', 'Pop', 'Jazz']

  @Column({ nullable: true })
  formationYear?: number;

  @Column()
  country: string;

  @OneToMany(() => Tour, tour => tour.artist)
  tours: Tour[];

  @OneToMany(() => Concert, concert => concert.artist)
  concerts: Concert[];

  @Column({ nullable: true })
  spotifyId?: string; // Integration ID
}
