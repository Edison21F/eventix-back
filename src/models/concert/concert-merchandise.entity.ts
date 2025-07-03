import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Concert } from './concert.entity';

@Entity()
export class ConcertMerchandise {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Concert, concert => concert.merchandise)
  concert: Concert;

  @Column()
  name: string; // "Tour T-Shirt 2024"

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('simple-array')
  sizes: string[]; // ['S', 'M', 'L', 'XL']

  @Column()
  inventory: number;

  @Column()
  isExclusive: boolean;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  isAvailable: boolean;
}
