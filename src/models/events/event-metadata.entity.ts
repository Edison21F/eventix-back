import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';

@Entity()
export class EventMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, event => event.metadata)
  event: Event;

  @Column()
  key: string; // Clave del metadato

  @Column()
  value: string; // Valor del metadato

  @Column({ nullable: true })
  dataType?: string; // Tipo de dato (ej: 'string', 'number', 'boolean')

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
