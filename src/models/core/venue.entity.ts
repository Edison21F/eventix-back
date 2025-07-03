import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Event } from '../events/event.entity';
import { Concert } from '../concert/concert.entity';

@Entity()
export class Venue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column('json')
  location: {
    lat: number;
    lng: number;
  };

  @Column()
  capacity: number;

  @Column('json', { nullable: true })
  facilities?: string[];

  @OneToMany(() => Event, event => event.venue)
  events: Event[];

  @OneToMany(() => Concert, concert => concert.venue)
  concerts: Concert[];
}
