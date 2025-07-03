import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

export enum CategoryType {
  EVENT_TYPE = 'EVENT_TYPE',
  TICKET_TIER = 'TICKET_TIER',
  AMENITY = 'AMENITY',
}

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  type: CategoryType;

  @Column({ nullable: true })
  icon?: string;

  @ManyToOne(() => Category, category => category.children)
  parent?: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @Column('json', { nullable: true })
  metadata?: any;
}
