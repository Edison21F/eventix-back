import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Event } from '../events/event.entity';
import { Concert } from '../concert/concert.entity';
import { Movie } from '../cinema/movie.entity';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  type: MediaType;

  @Column()
  altText: string;

  @ManyToOne(() => Event, event => event.mediaItems, { nullable: true })
  event?: Event;

  @ManyToOne(() => Concert, concert => concert.mediaItems, { nullable: true })
  concert?: Concert;

  @ManyToOne(() => Movie, movie => movie.mediaItems, { nullable: true })
  movie?: Movie;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;
}
