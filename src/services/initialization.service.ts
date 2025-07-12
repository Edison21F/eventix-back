import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/core/user.entity';
import { Role } from '../models/core/role.entity';
import { Permission } from '../models/core/permission.entity';
import { RolePermission } from '../models/core/role-permission.entity';
import { UserRole } from '../models/core/user-role.entity';
import { EncryptionService } from './encryption.service';
import { PermissionsService } from './permissions.service';
import { logger } from '../config/logging.config';

@Injectable()
export class InitializationService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private encryptionService: EncryptionService,
    private permissionsService: PermissionsService,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeDefaultData();
      logger.info('✅ Default data initialized successfully');
    } catch (error) {
      logger.error('❌ Error initializing default data', {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  private async initializeDefaultData() {
    logger.info('🚀 Starting default data initialization...');

    // 1. Inicializar permisos por defecto
    await this.initializeDefaultPermissions();

    // 2. Crear roles por defecto
    await this.createDefaultRoles();

    // 3. Crear usuario administrador por defecto
    await this.createDefaultAdmin();

    // 4. Crear usuarios de prueba
    await this.createTestUsers();
  }

  private async initializeDefaultPermissions(): Promise<void> {
    logger.info('📋 Initializing default permissions...');

    const defaultPermissions = [
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

    for (const permissionData of defaultPermissions) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { codeName: permissionData.codeName }
      });

      if (!existingPermission) {
        const permission = this.permissionRepository.create(permissionData);
        await this.permissionRepository.save(permission);
        logger.info(`Created permission: ${permission.codeName}`);
      }
    }
  }

  private async createDefaultRoles() {
    logger.info('🎭 Creating default roles...');

    const defaultRoles = [
      {
        name: 'admin',
        description: 'Administrador del sistema con acceso completo',
        isSystemRole: true,
        permissions: [
          'create_user', 'read_user', 'update_user', 'delete_user',
          'create_role', 'read_role', 'update_role', 'delete_role',
          'create_permission', 'read_permission', 'update_permission', 'delete_permission',
          'create_event', 'read_event', 'update_event', 'delete_event',
          'create_order', 'read_order', 'update_order', 'cancel_order', 'process_refund',
          'view_reports', 'export_reports',
          'system_config', 'view_logs'
        ]
      },
      {
        name: 'user_manager',
        description: 'Gestor de usuarios con permisos limitados',
        isSystemRole: true,
        permissions: [
          'read_user', 'update_user',
          'read_role', 'read_permission',
          'read_event', 'read_order',
          'view_reports'
        ]
      },
      {
        name: 'event_manager',
        description: 'Gestor de eventos',
        isSystemRole: true,
        permissions: [
          'create_event', 'read_event', 'update_event', 'delete_event',
          'read_order', 'update_order',
          'view_reports'
        ]
      },
      {
        name: 'sales_manager',
        description: 'Gestor de ventas',
        isSystemRole: true,
        permissions: [
          'create_order', 'read_order', 'update_order', 'cancel_order',
          'process_refund',
          'view_reports', 'export_reports'
        ]
      },
      {
        name: 'customer',
        description: 'Cliente del sistema',
        isSystemRole: true,
        permissions: [
          'read_event', 'create_order', 'read_order'
        ]
      }
    ];

    for (const roleData of defaultRoles) {
      let role = await this.roleRepository.findOne({
        where: { name: roleData.name }
      });

      if (!role) {
        role = this.roleRepository.create({
          name: roleData.name,
          description: roleData.description,
          isSystemRole: roleData.isSystemRole
        });
        role = await this.roleRepository.save(role);
        logger.info(`Created default role: ${role.name}`);
      }

      // Asignar permisos al rol
      await this.assignPermissionsToRole(role, roleData.permissions);
    }
  }

  private async assignPermissionsToRole(role: Role, permissionCodes: string[]) {
    // Limpiar permisos existentes
    await this.rolePermissionRepository.delete({ role: { id: role.id } });

    // Obtener permisos por código
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.codeName IN (:...codes)', { codes: permissionCodes })
      .getMany();

    // Crear relaciones rol-permiso
    const rolePermissions = permissions.map(permission => 
      this.rolePermissionRepository.create({
        role: role,
        permission: permission,
        isActive: true
      })
    );

    if (rolePermissions.length > 0) {
      await this.rolePermissionRepository.save(rolePermissions);
      logger.info(`Assigned ${rolePermissions.length} permissions to role ${role.name}`);
    }
  }

  private async createDefaultAdmin() {
    logger.info('👑 Creating default admin user...');

    const adminEmail = 'admin@eventix.com';
    
    let admin = await this.userRepository.findOne({
      where: { email: adminEmail }
    });

    if (!admin) {
      const hashedPassword = await this.encryptionService.hashPassword('Admin123!');
      
      admin = this.userRepository.create({
        email: adminEmail,
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: true,
      });

      admin = await this.userRepository.save(admin);
      logger.info('Created default admin user');

      // Asignar rol de administrador
      const adminRole = await this.roleRepository.findOne({
        where: { name: 'admin' }
      });

      if (adminRole) {
        const userRole = this.userRoleRepository.create({
          user: admin,
          role: adminRole,
          assignedBy: undefined
        });

        await this.userRoleRepository.save(userRole);
        logger.info('Assigned admin role to default admin user');
      }
    } else {
      logger.info('Default admin user already exists');
    }
  }

  private async createTestUsers() {
    logger.info('👥 Creating test users...');

    const testUsers = [
      {
        email: 'manager@eventix.com',
        password: 'Manager123!',
        personalData: {
          firstName: 'Usuario',
          lastName: 'Manager',
        },
        role: 'user_manager'
      },
      {
        email: 'events@eventix.com',
        password: 'Events123!',
        personalData: {
          firstName: 'Gestor',
          lastName: 'Eventos',
        },
        role: 'event_manager'
      },
      {
        email: 'sales@eventix.com',
        password: 'Sales123!',
        personalData: {
          firstName: 'Gestor',
          lastName: 'Ventas',
        },
        role: 'sales_manager'
      },
      {
        email: 'customer@example.com',
        password: 'Customer123!',
        personalData: {
          firstName: 'Cliente',
          lastName: 'Ejemplo',
        },
        role: 'customer'
      }
    ];

    for (const userData of testUsers) {
      let user = await this.userRepository.findOne({
        where: { email: userData.email }
      });

      if (!user) {
        const hashedPassword = await this.encryptionService.hashPassword(userData.password);
        
        user = this.userRepository.create({
          email: userData.email,
          passwordHash: hashedPassword,
          isActive: true,
          emailVerified: true,
        });

        user = await this.userRepository.save(user);

        // Asignar rol
        const role = await this.roleRepository.findOne({
          where: { name: userData.role }
        });

        if (role) {
          const userRole = this.userRoleRepository.create({
            user: user,
            role: role,
            assignedBy: undefined
          });

          await this.userRoleRepository.save(userRole);
        }

        logger.info(`Created test user: ${user.email}`);
      } else {
        logger.info(`Test user already exists: ${user.email}`);
      }
    }
  }
}
