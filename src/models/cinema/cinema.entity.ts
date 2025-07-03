import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CinemaRoom } from './cinema-room.entity';
import { MovieScreening } from './movie-screening.entity';

@Entity()
export class Cinema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column('json')
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };

  @Column('simple-array')
  amenities: string[]; // ['IMAX', '3D', 'Cafeteria']

  @OneToMany(() => CinemaRoom, room => room.cinema)
  rooms: CinemaRoom[];

  @OneToMany(() => MovieScreening, screening => screening.cinema)
  screenings: MovieScreening[];

  @Column({ default: true })
  isActive: boolean;
}
