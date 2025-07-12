import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/core/user.entity';
import { UserRole } from '../models/core/user-role.entity';
import { Role } from '../models/core/role.entity';
import { CreateUserDto } from '../Dto/create/create-user.dto';
import { UpdateUserDto } from '../Dto/update/update-user.dto';
import { EncryptionService } from './encryption.service';
import { UserPersonalDataService } from './user-personal-data.service';
import { logger } from '../config/logging.config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private encryptionService: EncryptionService,
    private personalDataService: UserPersonalDataService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Encriptar contraseña
    const hashedPassword = await this.encryptionService.hashPassword(createUserDto.password);

    // Crear usuario en MySQL
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash: hashedPassword,
      isActive: true,
      emailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Crear datos personales en MongoDB
    let personalData = null;
    if (createUserDto.personalData) {
      await this.personalDataService.create({
        userId: savedUser.id,
        firstName: createUserDto.personalData.firstName ?? '',
        lastName: createUserDto.personalData.lastName ?? '',
        birthDate: createUserDto.personalData.birthDate
          ? (typeof createUserDto.personalData.birthDate === 'string'
              ? new Date(createUserDto.personalData.birthDate)
              : createUserDto.personalData.birthDate)
          : undefined,
        address: createUserDto.personalData.address ?? '',
        phone: createUserDto.personalData.phone ?? '',
        documentType: createUserDto.personalData.documentType ?? '',
        documentNumber: createUserDto.personalData.documentNumber ?? '',
        nationality: createUserDto.personalData.nationality ?? '',
        emergencyContact: typeof createUserDto.personalData.emergencyContact === 'object'
          ? createUserDto.personalData.emergencyContact
          : undefined,
        preferences: typeof createUserDto.personalData.preferences === 'object'
          ? createUserDto.personalData.preferences
          : undefined,
      });
    }

    // Asignar roles si se proporcionaron
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      await this.assignRoles(savedUser.id, createUserDto.roleIds);
    }

    logger.info('User created successfully', {
      userId: savedUser.id,
      email: savedUser.email
    });

    return this.findOne(savedUser.id);
  }

  async findAll(): Promise<any[]> {
    const users = await this.userRepository.find({
      relations: ['roles', 'roles.role'],
      select: {
        id: true,
        email: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        roles: {
          id: true,
          assignedAt: true,
          role: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    // Obtener datos personales de MongoDB para cada usuario
    const usersWithPersonalData = await Promise.all(
      users.map(async (user) => {
        const personalData = await this.personalDataService.findByUserId(user.id);
        return {
          ...user,
          personalData: personalData ? {
            firstName: personalData.firstName,
            lastName: personalData.lastName,
            phone: personalData.phone,
            address: personalData.address,
            nationality: personalData.nationality,
            preferences: personalData.preferences,
          } : null
        };
      })
    );

    return usersWithPersonalData;
  }

  async findOne(id: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission'],
      select: {
        id: true,
        email: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          id: true,
          assignedAt: true,
          role: {
            id: true,
            name: true,
            description: true,
            permissions: {
              id: true,
              isActive: true,
              permission: {
                id: true,
                codeName: true,
                displayName: true,
                category: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Obtener datos personales de MongoDB
    const personalData = await this.personalDataService.findByUserId(user.id);

    return {
      ...user,
      personalData: personalData ? {
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        birthDate: personalData.birthDate,
        address: personalData.address,
        phone: personalData.phone,
        documentType: personalData.documentType,
        documentNumber: personalData.documentNumber,
        nationality: personalData.nationality,
        emergencyContact: personalData.emergencyContact,
        preferences: personalData.preferences,
        metadata: personalData.metadata,
      } : null
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Verificar email único si se está actualizando
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });
      if (existingUser) {
        throw new BadRequestException('El email ya está registrado');
      }
    }

    // Actualizar usuario en MySQL
    const { personalData, roleIds, ...userUpdates } = updateUserDto;
    if (Object.keys(userUpdates).length > 0) {
      await this.userRepository.update(id, userUpdates);
    }

    // Actualizar datos personales en MongoDB si se proporcionaron
    if (personalData) {
      try {
        await this.personalDataService.update(id, personalData);
      } catch (error) {
        // Si no existen datos personales, crearlos
        if (error instanceof NotFoundException) {
          await this.personalDataService.create({
            userId: id,
            ...personalData
          } as any);
        } else {
          throw error;
        }
      }
    }

    // Actualizar roles si se proporcionaron
    if (roleIds !== undefined) {
      await this.updateUserRoles(id, roleIds);
    }

    logger.info('User updated successfully', { userId: id });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    
    // Soft delete - marcar como inactivo en lugar de eliminar
    await this.userRepository.update(id, { isActive: false });

    logger.info('User deactivated', { userId: id });
  }

  async hardDelete(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Eliminar datos personales de MongoDB
    await this.personalDataService.delete(id);

    // Eliminar relaciones de roles
    await this.userRoleRepository.delete({ user: { id } });

    // Eliminar usuario de MySQL
    await this.userRepository.delete(id);

    logger.info('User hard deleted', { userId: id });
  }

  private async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    const roles = await this.roleRepository.findByIds(roleIds);
    
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Algunos roles no existen');
    }

    const userRoles = roles.map(role => 
      this.userRoleRepository.create({
        user: { id: userId } as User,
        role: role,
      })
    );

    await this.userRoleRepository.save(userRoles);
  }

  private async updateUserRoles(userId: number, roleIds: number[]): Promise<void> {
    // Eliminar roles actuales
    await this.userRoleRepository.delete({ user: { id: userId } });

    // Asignar nuevos roles
    if (roleIds.length > 0) {
      await this.assignRoles(userId, roleIds);
    }
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission']
    });

    if (!user) {
      return [];
    }

    const permissions = new Set<string>();
    user.roles?.forEach(userRole => {
      userRole.role.permissions?.forEach(rolePermission => {
        if (rolePermission.isActive) {
          permissions.add(rolePermission.permission.codeName);
        }
      });
    });

    return Array.from(permissions);
  }

  async searchUsers(searchTerm: string, limit: number = 10): Promise<any[]> {
    // Buscar por email en MySQL
    const usersByEmail = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .andWhere('user.isActive = true')
      .limit(limit)
      .getMany();

    // Buscar por nombre en MongoDB
    const personalDataResults = await this.personalDataService.searchByName(searchTerm, limit);
    const userIds = personalDataResults.map(pd => pd.userId);
    
    let usersByName: User[] = [];
    if (userIds.length > 0) {
      usersByName = await this.userRepository
        .createQueryBuilder('user')
        .whereInIds(userIds)
        .andWhere('user.isActive = true')
        .getMany();
    }

    // Combinar resultados y eliminar duplicados
    const allUsers = [...usersByEmail, ...usersByName];
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    // Agregar datos personales
    const usersWithPersonalData = await Promise.all(
      uniqueUsers.slice(0, limit).map(async (user) => {
        const personalData = await this.personalDataService.findByUserId(user.id);
        return {
          id: user.id,
          email: user.email,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          personalData: personalData ? {
            firstName: personalData.firstName,
            lastName: personalData.lastName,
            phone: personalData.phone,
          } : null
        };
      })
    );

    return usersWithPersonalData;
  }

  async getUserStatistics(): Promise<any> {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      personalDataStats
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { emailVerified: true } }),
      this.personalDataService.getStatistics()
    ]);

    return {
      mysql: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        inactive: totalUsers - activeUsers,
      },
      mongodb: personalDataStats,
      combined: {
        usersWithPersonalData: personalDataStats.total,
        usersWithoutPersonalData: totalUsers - personalDataStats.total,
      }
    };
  }
}