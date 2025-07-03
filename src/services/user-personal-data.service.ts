import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserPersonalData } from '../models/core/user-personal-data.schema';
import { EncryptionService } from './encryption.service';
import { logger } from '../config/logging.config';

export interface CreatePersonalDataDto {
  userId: number;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  address?: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  nationality?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    marketing: boolean;
  };
}

export interface UpdatePersonalDataDto extends Partial<Omit<CreatePersonalDataDto, 'userId'>> {}

@Injectable()
export class UserPersonalDataService {
  constructor(
    @InjectModel(UserPersonalData.name)
    private userPersonalDataModel: Model<UserPersonalData>,
    private encryptionService: EncryptionService,
  ) {}

  async create(createDto: CreatePersonalDataDto): Promise<UserPersonalData> {
    try {
      // Encriptar datos sensibles si existen
      const encryptedData = { ...createDto };
      if (createDto.documentNumber) {
        encryptedData.documentNumber = this.encryptionService.encrypt(createDto.documentNumber);
      }

      const personalData = new this.userPersonalDataModel({
        ...encryptedData,
        preferences: createDto.preferences || {
          language: 'es',
          timezone: 'America/Guayaquil',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          marketing: false,
        },
      });

      const saved = await personalData.save();
      
      logger.info('User personal data created', {
        userId: createDto.userId,
        documentId: saved._id,
      });

      return saved;
    } catch (error) {
      logger.error('Error creating user personal data', {
        userId: createDto.userId,
        error: error.message,
      });
      throw error;
    }
  }

  async findByUserId(userId: number): Promise<UserPersonalData | null> {
    try {
      const personalData = await this.userPersonalDataModel.findOne({ userId }).exec();
      
      if (personalData && personalData.documentNumber) {
        // Desencriptar datos sensibles para uso interno
        const decrypted = personalData.toObject();
        decrypted.documentNumber = this.encryptionService.decrypt(personalData.documentNumber);
        return decrypted as any;
      }

      return personalData;
    } catch (error) {
      logger.error('Error finding user personal data', {
        userId,
        error: error.message,
      });
      return null;
    }
  }

  async update(userId: number, updateDto: UpdatePersonalDataDto): Promise<UserPersonalData> {
    try {
      const existingData = await this.userPersonalDataModel.findOne({ userId });
      
      if (!existingData) {
        throw new NotFoundException(`Datos personales no encontrados para el usuario ${userId}`);
      }

      // Encriptar datos sensibles si se están actualizando
      const encryptedUpdate = { ...updateDto };
      if (updateDto.documentNumber) {
        encryptedUpdate.documentNumber = this.encryptionService.encrypt(updateDto.documentNumber);
      }

      const updated = await this.userPersonalDataModel.findOneAndUpdate(
        { userId },
        { $set: encryptedUpdate },
        { new: true }
      ).exec();

      logger.info('User personal data updated', {
        userId,
        documentId: updated ? updated._id : null,
      });

      // Desencriptar para retorno
      if (updated && updated.documentNumber) {
        const decrypted = updated.toObject();
        decrypted.documentNumber = this.encryptionService.decrypt(updated.documentNumber);
        return decrypted as any;
      }

      if (!updated) {
        throw new NotFoundException(`Datos personales no encontrados para el usuario ${userId}`);
      }

      return updated as any;
    } catch (error) {
      logger.error('Error updating user personal data', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  async delete(userId: number): Promise<boolean> {
    try {
      const result = await this.userPersonalDataModel.deleteOne({ userId }).exec();
      
      logger.info('User personal data deleted', {
        userId,
        deleted: result.deletedCount > 0,
      });

      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Error deleting user personal data', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  async updateLastLogin(userId: number, ip: string): Promise<void> {
    try {
      await this.userPersonalDataModel.findOneAndUpdate(
        { userId },
        { 
          $set: { 
            'metadata.lastLoginIp': ip,
            'metadata.lastLoginAt': new Date(),
          }
        }
      ).exec();
    } catch (error) {
      logger.error('Error updating last login', {
        userId,
        error: error.message,
      });
    }
  }

  async updateEmailVerification(userId: number): Promise<void> {
    try {
      await this.userPersonalDataModel.findOneAndUpdate(
        { userId },
        { 
          $set: { 
            'metadata.emailVerifiedAt': new Date(),
          }
        }
      ).exec();

      logger.info('Email verification updated', { userId });
    } catch (error) {
      logger.error('Error updating email verification', {
        userId,
        error: error.message,
      });
    }
  }

  async searchByName(searchTerm: string, limit: number = 10): Promise<UserPersonalData[]> {
    try {
      const regex = new RegExp(searchTerm, 'i');
      return await this.userPersonalDataModel
        .find({
          $or: [
            { firstName: regex },
            { lastName: regex },
          ]
        })
        .limit(limit)
        .select('-documentNumber') // No incluir datos sensibles en búsquedas
        .exec();
    } catch (error) {
      logger.error('Error searching users by name', {
        searchTerm,
        error: error.message,
      });
      return [];
    }
  }

  async getStatistics(): Promise<{
    total: number;
    withPhone: number;
    withDocument: number;
    emailVerified: number;
    byCountry: Record<string, number>;
  }> {
    try {
      const [
        total,
        withPhone,
        withDocument,
        emailVerified,
        byCountry
      ] = await Promise.all([
        this.userPersonalDataModel.countDocuments(),
        this.userPersonalDataModel.countDocuments({ phone: { $exists: true, $ne: null } }),
        this.userPersonalDataModel.countDocuments({ documentNumber: { $exists: true, $ne: null } }),
        this.userPersonalDataModel.countDocuments({ 'metadata.emailVerifiedAt': { $exists: true } }),
        this.userPersonalDataModel.aggregate([
          { $group: { _id: '$nationality', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      const countryStats = {};
      byCountry.forEach(item => {
        countryStats[item._id || 'Unknown'] = item.count;
      });

      return {
        total,
        withPhone,
        withDocument,
        emailVerified,
        byCountry: countryStats,
      };
    } catch (error) {
      logger.error('Error getting user statistics', {
        error: error.message,
      });
      throw error;
    }
  }
}