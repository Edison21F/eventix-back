import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../models/core/permission.entity';
import { RolePermission } from '../../models/core/role-permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { logger } from '../../config/logging.config';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // Verificar si el codeName ya existe
    const existingPermission = await this.permissionRepository.findOne({
      where: { codeName: createPermissionDto.codeName }
    });

    if (existingPermission) {
      throw new BadRequestException('El código del permiso ya está registrado');
    }

    // Crear permiso
    const permission = this.permissionRepository.create({
      codeName: createPermissionDto.codeName,
      displayName: createPermissionDto.displayName,
      category: createPermissionDto.category,
      description: createPermissionDto.description,
    });

    const savedPermission = await this.permissionRepository.save(permission);

    logger.info('Permission created successfully', {
      permissionId: savedPermission.id,
      codeName: savedPermission.codeName
    });

    return savedPermission;
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      relations: ['rolePermissions', 'rolePermissions.role'],
      select: {
        id: true,
        codeName: true,
        displayName: true,
        category: true,
        description: true,
        rolePermissions: {
          id: true,
          isActive: true,
          assignedAt: true,
          role: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.role'],
      select: {
        id: true,
        codeName: true,
        displayName: true,
        category: true,
        description: true,
        rolePermissions: {
          id: true,
          isActive: true,
          assignedAt: true,
          role: {
            id: true,
            name: true,
            description: true,
            isSystemRole: true
          }
        }
      }
    });

    if (!permission) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }

    return permission;
  }

  async findByCategory(category: string): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { category },
      order: { displayName: 'ASC' }
    });
  }

  async findByCodeName(codeName: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { codeName }
    });

    if (!permission) {
      throw new NotFoundException(`Permiso con código ${codeName} no encontrado`);
    }

    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    // Verificar codeName único si se está actualizando
    if (updatePermissionDto.codeName && updatePermissionDto.codeName !== permission.codeName) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { codeName: updatePermissionDto.codeName }
      });
      if (existingPermission) {
        throw new BadRequestException('El código del permiso ya está registrado');
      }
    }

    await this.permissionRepository.update(id, updatePermissionDto);

    logger.info('Permission updated successfully', { permissionId: id });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);

    // Verificar si hay roles que usan este permiso
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { permission: { id } },
      relations: ['role']
    });

    if (rolePermissions.length > 0) {
      const rolesUsing = rolePermissions.map(rp => rp.role.name).join(', ');
      throw new BadRequestException(
        `No se puede eliminar el permiso. Está siendo usado por los roles: ${rolesUsing}`
      );
    }

    await this.permissionRepository.delete(id);

    logger.info('Permission deleted successfully', { permissionId: id });
  }

  async getCategories(): Promise<string[]> {
    const result = await this.permissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.category', 'category')
      .getRawMany();

    return result.map(item => item.category);
  }

  async getPermissionsByRole(roleId: number): Promise<Permission[]> {
    return this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.rolePermissions', 'rp')
      .innerJoin('rp.role', 'role')
      .where('role.id = :roleId', { roleId })
      .andWhere('rp.isActive = true')
      .getMany();
  }

  async searchPermissions(searchTerm: string): Promise<Permission[]> {
    return this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.codeName LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('permission.displayName LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('permission.description LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('permission.category', 'ASC')
      .addOrderBy('permission.displayName', 'ASC')
      .getMany();
  }

  async bulkCreate(permissionsData: CreatePermissionDto[]): Promise<Permission[]> {
    const permissions: Permission[] = [];

    for (const permissionDto of permissionsData) {
      // Verificar si ya existe
      const existing = await this.permissionRepository.findOne({
        where: { codeName: permissionDto.codeName }
      });

      if (!existing) {
        const permission = this.permissionRepository.create(permissionDto);
        permissions.push(permission);
      }
    }

    if (permissions.length > 0) {
      const savedPermissions = await this.permissionRepository.save(permissions);
      
      logger.info('Bulk permissions created', {
        count: savedPermissions.length,
        codes: savedPermissions.map(p => p.codeName)
      });

      return savedPermissions;
    }

    return [];
  }

  async initializeDefaultPermissions(): Promise<void> {
    const defaultPermissions: CreatePermissionDto[] = [
      // Gestión de usuarios
      { codeName: 'create_user', displayName: 'Crear Usuario', category: 'USER_MANAGEMENT', description: 'Permite crear nuevos usuarios' },
      { codeName: 'read_user', displayName: 'Ver Usuario', category: 'USER_MANAGEMENT', description: 'Permite ver información de usuarios' },
      { codeName: 'update_user', displayName: 'Actualizar Usuario', category: 'USER_MANAGEMENT', description: 'Permite actualizar información de usuarios' },
      { codeName: 'delete_user', displayName: 'Eliminar Usuario', category: 'USER_MANAGEMENT', description: 'Permite eliminar usuarios' },
      
      // Gestión de roles
      { codeName: 'create_role', displayName: 'Crear Rol', category: 'ROLE_MANAGEMENT', description: 'Permite crear nuevos roles' },
      { codeName: 'read_role', displayName: 'Ver Rol', category: 'ROLE_MANAGEMENT', description: 'Permite ver información de roles' },
      { codeName: 'update_role', displayName: 'Actualizar Rol', category: 'ROLE_MANAGEMENT', description: 'Permite actualizar roles' },
      { codeName: 'delete_role', displayName: 'Eliminar Rol', category: 'ROLE_MANAGEMENT', description: 'Permite eliminar roles' },
      
      // Gestión de permisos
      { codeName: 'create_permission', displayName: 'Crear Permiso', category: 'PERMISSION_MANAGEMENT', description: 'Permite crear nuevos permisos' },
      { codeName: 'read_permission', displayName: 'Ver Permiso', category: 'PERMISSION_MANAGEMENT', description: 'Permite ver permisos' },
      { codeName: 'update_permission', displayName: 'Actualizar Permiso', category: 'PERMISSION_MANAGEMENT', description: 'Permite actualizar permisos' },
      { codeName: 'delete_permission', displayName: 'Eliminar Permiso', category: 'PERMISSION_MANAGEMENT', description: 'Permite eliminar permisos' },
      
      // Gestión de eventos
      { codeName: 'create_event', displayName: 'Crear Evento', category: 'EVENT_MANAGEMENT', description: 'Permite crear nuevos eventos' },
      { codeName: 'read_event', displayName: 'Ver Evento', category: 'EVENT_MANAGEMENT', description: 'Permite ver eventos' },
      { codeName: 'update_event', displayName: 'Actualizar Evento', category: 'EVENT_MANAGEMENT', description: 'Permite actualizar eventos' },
      { codeName: 'delete_event', displayName: 'Eliminar Evento', category: 'EVENT_MANAGEMENT', description: 'Permite eliminar eventos' },
      
      // Gestión de ventas
      { codeName: 'create_order', displayName: 'Crear Orden', category: 'SALES_MANAGEMENT', description: 'Permite crear órdenes de venta' },
      { codeName: 'read_order', displayName: 'Ver Orden', category: 'SALES_MANAGEMENT', description: 'Permite ver órdenes' },
      { codeName: 'update_order', displayName: 'Actualizar Orden', category: 'SALES_MANAGEMENT', description: 'Permite actualizar órdenes' },
      { codeName: 'cancel_order', displayName: 'Cancelar Orden', category: 'SALES_MANAGEMENT', description: 'Permite cancelar órdenes' },
      { codeName: 'process_refund', displayName: 'Procesar Reembolso', category: 'SALES_MANAGEMENT', description: 'Permite procesar reembolsos' },
      
      // Reportes
      { codeName: 'view_reports', displayName: 'Ver Reportes', category: 'REPORTS', description: 'Permite ver reportes del sistema' },
      { codeName: 'export_reports', displayName: 'Exportar Reportes', category: 'REPORTS', description: 'Permite exportar reportes' },
      
      // Configuración del sistema
      { codeName: 'system_config', displayName: 'Configuración del Sistema', category: 'SYSTEM', description: 'Permite configurar el sistema' },
      { codeName: 'view_logs', displayName: 'Ver Logs', category: 'SYSTEM', description: 'Permite ver logs del sistema' },
    ];

    await this.bulkCreate(defaultPermissions);
    
    logger.info('Default permissions initialized');
  }
}