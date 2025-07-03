import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Cinema } from './cinema.entity';
import { MovieScreening } from './movie-screening.entity';
import { Seat } from '../events/seat.entity';

@Entity()
export class CinemaRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // "Sala 1"

  @ManyToOne(() => Cinema, cinema => cinema.rooms)
  cinema: Cinema;

  @Column()
  capacity: number;

  @Column('simple-array')
  features: string[]; // ['Dolby Atmos', 'Wheelchair Access']

  @OneToMany(() => MovieScreening, screening => screening.room)
  screenings: MovieScreening[];

  @OneToMany(() => Seat, seat => seat.room)
  seats: Seat[];
}
