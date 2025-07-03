import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Artist } from './artist.entity';
import { Tour } from './tour.entity';
import { Venue } from '../core/venue.entity';
import { TicketTier } from './ticket-tier.entity';
import { SupportAct } from './support-act.entity';
import { ConcertMerchandise } from './concert-merchandise.entity';
import { FanExperience } from './fan-experience.entity';
import { SeatingZone } from './seating-zone.entity';
import { StageConfiguration } from './stage-configuration.entity';
import { Media } from '../core/media.entity';

@Entity()
export class Concert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // "Summer Night Concert"

  @ManyToOne(() => Artist, artist => artist.concerts)
  artist: Artist;

  @ManyToOne(() => Tour, tour => tour.concerts)
  tour: Tour;

  @ManyToOne(() => Venue)
  venue: Venue;

  @Column()
  dateTime: Date;

  @Column()
  durationMinutes: number;

  @OneToMany(() => TicketTier, tier => tier.concert)
  ticketTiers: TicketTier[];

  @OneToMany(() => SupportAct, act => act.concert)
  supportActs: SupportAct[];

  @Column({ default: true })
  isSoldOut: boolean;

  // Add to concert.entity.ts
@OneToMany(() => ConcertMerchandise, merch => merch.concert)
merchandise: ConcertMerchandise[];
@OneToMany(() => FanExperience, exp => exp.concert)
fanExperiences: FanExperience[];
@OneToMany(() => SeatingZone, zone => zone.concert)
seatingZones: SeatingZone[];
@OneToMany(() => StageConfiguration, config => config.concert)
stageConfigurations: StageConfiguration[];

@OneToMany(() => Media, media => media.concert)
  mediaItems: Media[];
}
