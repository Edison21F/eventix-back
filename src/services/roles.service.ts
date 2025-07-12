import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../models/core/role.entity';
import { RolePermission } from '../models/core/role-permission.entity';
import { Permission } from '../models/core/permission.entity';
import { CreateRoleDto } from '../Dto/create/create-role.dto';
import { UpdateRoleDto } from '../Dto/update/update-role.dto';
import { logger } from '../config/logging.config';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Verificar si el nombre ya existe
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw new BadRequestException('El nombre del rol ya está registrado');
    }

    // Crear rol
    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      isSystemRole: createRoleDto.isSystemRole || false,
    });

    const savedRole = await this.roleRepository.save(role);

    // Asignar permisos si se proporcionaron
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      await this.assignPermissions(savedRole.id, createRoleDto.permissionIds);
    }

    logger.info('Role created successfully', {
      roleId: savedRole.id,
      name: savedRole.name
    });

    return this.findOne(savedRole.id);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions', 'permissions.permission'],
      select: {
        id: true,
        name: true,
        description: true,
        isSystemRole: true,
        permissions: {
          id: true,
          isActive: true,
          assignedAt: true,
          permission: {
            id: true,
            codeName: true,
            displayName: true,
            category: true,
            description: true
          }
        }
      }
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'permissions.permission', 'userRoles', 'userRoles.user'],
      select: {
        id: true,
        name: true,
        description: true,
        isSystemRole: true,
        permissions: {
          id: true,
          isActive: true,
          assignedAt: true,
          permission: {
            id: true,
            codeName: true,
            displayName: true,
            category: true,
            description: true
          }
        },
        userRoles: {
          id: true,
          assignedAt: true,
          user: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // Verificar que no sea un rol del sistema si se intenta modificar datos críticos
    if (role.isSystemRole && (updateRoleDto.name || updateRoleDto.isSystemRole !== undefined)) {
      throw new BadRequestException('No se pueden modificar roles del sistema');
    }

    // Verificar nombre único si se está actualizando
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name }
      });
      if (existingRole) {
        throw new BadRequestException('El nombre del rol ya está registrado');
      }
    }

    await this.roleRepository.update(id, updateRoleDto);

    // Actualizar permisos si se proporcionaron
    if (updateRoleDto.permissionIds !== undefined) {
      await this.updateRolePermissions(id, updateRoleDto.permissionIds);
    }

    logger.info('Role updated successfully', { roleId: id });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystemRole) {
      throw new BadRequestException('No se pueden eliminar roles del sistema');
    }

    // Verificar si hay usuarios asignados
    if (role.userRoles && role.userRoles.length > 0) {
      throw new BadRequestException('No se puede eliminar un rol que tiene usuarios asignados');
    }

    // Eliminar permisos del rol
    await this.rolePermissionRepository.delete({ role: { id } });

    // Eliminar rol
    await this.roleRepository.delete(id);

    logger.info('Role deleted successfully', { roleId: id });
  }

  private async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    const permissions = await this.permissionRepository.findByIds(permissionIds);
    
    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Algunos permisos no existen');
    }

    const rolePermissions = permissions.map(permission => 
      this.rolePermissionRepository.create({
        role: { id: roleId } as Role,
        permission: permission,
        isActive: true
      })
    );

    await this.rolePermissionRepository.save(rolePermissions);
  }

  private async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Eliminar permisos actuales
    await this.rolePermissionRepository.delete({ role: { id: roleId } });

    // Asignar nuevos permisos
    if (permissionIds.length > 0) {
      await this.assignPermissions(roleId, permissionIds);
    }
  }

  async getRolePermissions(roleId: number): Promise<string[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions', 'permissions.permission']
    });

    if (!role) {
      return [];
    }

    return role.permissions
      ?.filter(rp => rp.isActive)
      .map(rp => rp.permission.codeName) || [];
  }

  async addPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    const role = await this.findOne(roleId);
    const permission = await this.permissionRepository.findOne({ where: { id: permissionId } });

    if (!permission) {
      throw new NotFoundException(`Permiso con ID ${permissionId} no encontrado`);
    }

    // Verificar si ya tiene el permiso
    const existingRolePermission = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permissionId } }
    });

    if (existingRolePermission) {
      if (!existingRolePermission.isActive) {
        existingRolePermission.isActive = true;
        await this.rolePermissionRepository.save(existingRolePermission);
      }
      return;
    }

    const rolePermission = this.rolePermissionRepository.create({
      role: role,
      permission: permission,
      isActive: true
    });

    await this.rolePermissionRepository.save(rolePermission);

    logger.info('Permission added to role', { roleId, permissionId });
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permissionId } }
    });

    if (!rolePermission) {
      throw new NotFoundException('Permiso no asignado a este rol');
    }

    await this.rolePermissionRepository.delete(rolePermission.id);

    logger.info('Permission removed from role', { roleId, permissionId });
  }
}