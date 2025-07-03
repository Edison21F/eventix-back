import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column({ default: false })
  isSystemRole: boolean;

  @OneToMany(() => RolePermission, rolePermission => rolePermission.role)
  permissions: RolePermission[];

   @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles: UserRole[];

}
