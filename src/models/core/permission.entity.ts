import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codeName: string; // Ej: 'create_user', 'edit_event'

  @Column()
  displayName: string;

  @Column()
  category: string; // 'USER_MANAGEMENT', 'EVENT_MANAGEMENT'

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  rolePermissions: RolePermission[];
}
