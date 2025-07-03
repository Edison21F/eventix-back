import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../models/core/user.entity';
import { UserRole } from '../../models/core/user-role.entity';
import { Role } from '../../models/core/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EncryptionService } from '../../services/encryption.service';
import { logger } from '../../config/logging.config';

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
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Encriptar contraseña
    const hashedPassword = await this.encryptionService.hashPassword(createUserDto.password);

    // Crear usuario
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash: hashedPassword,
      ...(createUserDto.personalData && { personalData: createUserDto.personalData }),
    });

    const savedUser = await this.userRepository.save(user);

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

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles', 'roles.role'],
      select: {
        id: true,
        email: true,
        isActive: true,
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
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission'],
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        roles: {
          id: true,
          assignedAt: true,
          role: {
            id: true,
            name: true,
            description: true,
            permissions: {
              id: true,
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

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Verificar email único si se está actualizando
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });
      if (existingUser) {
        throw new BadRequestException('El email ya está registrado');
      }
    }

    await this.userRepository.update(id, updateUserDto);

    // Actualizar roles si se proporcionaron
    if (updateUserDto.roleIds !== undefined) {
      await this.updateUserRoles(id, updateUserDto.roleIds);
    }

    logger.info('User updated successfully', { userId: id });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    
    // Soft delete - marcar como inactivo en lugar de eliminar
    await this.userRepository.update(id, { isActive: false });

    logger.info('User deactivated', { userId: id });
  }

  private async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    const roles = await this.roleRepository.findByIds(roleIds);
    
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Algunos roles no existen');
    }

    const userRoles = roles.map(role => 
      this.userRoleRepository.create({
        user: { id: userId },
        role: role,
        // assignedBy: null // Aquí se podría pasar el ID del admin que asigna
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
}