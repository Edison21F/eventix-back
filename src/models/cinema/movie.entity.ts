import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MovieScreening } from './movie-screening.entity';
import { MovieMetadata } from './movie-metadata.schema';
import { Media } from '../core/media.entity';

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  durationMinutes: number;

  @Column()
  releaseDate: Date;

  @Column('simple-array')
  genres: string[]; // ['Action', 'Sci-Fi']

  @Column({ nullable: true })
  rating?: string; // 'PG-13'

  @Column({ nullable: true })
  director?: string;

  @OneToMany(() => MovieScreening, screening => screening.movie)
  screenings: MovieScreening[];

  @OneToMany(() => Media, media => media.movie)
  mediaItems: Media[];
}
