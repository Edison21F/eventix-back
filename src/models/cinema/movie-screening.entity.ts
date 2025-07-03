import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Movie } from './movie.entity';
import { Cinema } from './cinema.entity';
import { CinemaRoom } from './cinema-room.entity';

@Entity()
export class MovieScreening {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Movie, movie => movie.screenings)
  movie: Movie;

  @ManyToOne(() => Cinema, cinema => cinema.screenings)
  cinema: Cinema;

  @ManyToOne(() => CinemaRoom, room => room.screenings)
  room: CinemaRoom;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column('decimal', { precision: 6, scale: 2 })
  basePrice: number;

  @Column({ default: 'REGULAR' })
  format: 'REGULAR' | '3D' | 'IMAX' | '4DX';

  @Column({ default: true })
  isActive: boolean;
}
