import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../models/core/user.entity';
import { EncryptionService } from '../../services/encryption.service';
import { UserPersonalDataService } from '../../services/user-personal-data.service';
import { LoginDto, ChangePasswordDto, ResetPasswordDto } from '../users/dto/auth.dto';
import { logger } from '../../config/logging.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
    private personalDataService: UserPersonalDataService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission'],
    });

    if (user && await this.encryptionService.verifyPassword(password, user.passwordHash)) {
      if (!user.isActive) {
        throw new UnauthorizedException('Usuario inactivo');
      }
      
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto, ip?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Obtener datos personales de MongoDB
    const personalData = await this.personalDataService.findByUserId(user.id);

    // Actualizar último login
    if (ip) {
      await this.personalDataService.updateLastLogin(user.id, ip);
    }

    const payload = { 
      email: user.email, 
      sub: user.id,
      roles: user.roles?.map(ur => ur.role.name) || []
    };

    logger.info('User login successful', {
      userId: user.id,
      email: user.email,
      ip: ip || 'unknown'
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        personalData: personalData ? {
          firstName: personalData.firstName,
          lastName: personalData.lastName,
          phone: personalData.phone,
          preferences: personalData.preferences,
        } : null,
        roles: user.roles?.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          permissions: ur.role.permissions?.map(rp => rp.permission.codeName) || []
        })) || []
      },
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await this.encryptionService.verifyPassword(
      changePasswordDto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    const hashedPassword = await this.encryptionService.hashPassword(changePasswordDto.newPassword);
    await this.userRepository.update(userId, { passwordHash: hashedPassword });

    logger.info('Password changed successfully', { userId });
    
    return { message: 'Contraseña actualizada exitosamente' };
  }

  async generateResetToken(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Por seguridad, no revelamos si el email existe
      return { message: 'Si el email existe, recibirás un enlace de recuperación' };
    }

    const resetToken = this.encryptionService.generateRandomToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });
    
    logger.info('Password reset token generated', { userId: user.id, email });
    
    return { message: 'Si el email existe, recibirás un enlace de recuperación' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { 
        passwordResetToken: resetPasswordDto.resetToken,
      }
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Token de recuperación inválido o expirado');
    }
    
    const hashedPassword = await this.encryptionService.hashPassword(resetPasswordDto.newPassword);
    
    await this.userRepository.update(user.id, {
      passwordHash: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    logger.info('Password reset successful', { userId: user.id });
    
    return { message: 'Contraseña restablecida exitosamente' };
  }

  async requestEmailVerification(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      return { message: 'El email ya está verificado' };
    }

    const verificationToken = this.encryptionService.generateRandomToken();
    
    await this.userRepository.update(userId, {
      emailVerificationToken: verificationToken,
    });

    logger.info('Email verification token generated', { userId });

    // Aquí deberías enviar el email con el token
    return { message: 'Se ha enviado un email de verificación' };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new BadRequestException('Token de verificación inválido');
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: undefined,
    });

    await this.personalDataService.updateEmailVerification(user.id);

    logger.info('Email verified successfully', { userId: user.id });

    return { message: 'Email verificado exitosamente' };
  }
}