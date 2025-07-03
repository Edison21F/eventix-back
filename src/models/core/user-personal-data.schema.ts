import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserPersonalData extends Document {
  @Prop({ required: true, unique: true })
  userId: number; // Referencia al ID del usuario en MySQL

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: Date })
  birthDate?: Date;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop()
  documentType?: string; // 'CEDULA', 'PASSPORT', 'LICENSE'

  @Prop()
  documentNumber?: string; // Encriptado

  @Prop()
  nationality?: string;

  @Prop({ type: Object }) // Especificar el tipo de emergencyContact
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  @Prop({ type: Object }) // Especificar el tipo de preferences
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

  @Prop({ type: Object }) // Especificar el tipo de metadata
  metadata?: {
    lastLoginIp?: string;
    lastLoginAt?: Date;
    registrationIp?: string;
    emailVerifiedAt?: Date;
    phoneVerifiedAt?: Date;
  };
}

export const UserPersonalDataSchema = SchemaFactory.createForClass(UserPersonalData);

// Índices para optimización
UserPersonalDataSchema.index({ userId: 1 }, { unique: true }); // Asegúrate de que este índice no esté duplicado
UserPersonalDataSchema.index({ documentNumber: 1 }, { sparse: true });
UserPersonalDataSchema.index({ createdAt: -1 });
