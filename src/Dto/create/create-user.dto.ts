import { IsEmail, IsString, MinLength, IsOptional, IsDateString, ValidateNested, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// Definición de EmergencyContactDto primero
export class EmergencyContactDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  relationship: string;
}

// Definición de NotificationsDto
export class NotificationsDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  sms: boolean;

  @IsBoolean()
  push: boolean;
}

// Definición de PreferencesDto
export class PreferencesDto {
  @IsString()
  language: string;

  @IsString()
  timezone: string;

  @ValidateNested()
  @Type(() => NotificationsDto)
  notifications: NotificationsDto;

  @IsBoolean()
  marketing: boolean;
}

// Definición de PersonalDataDto
export class PersonalDataDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;
}

// Definición de CreateUser Dto
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @ValidateNested()
  @Type(() => PersonalDataDto)
  personalData: Partial<PersonalDataDto>;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds?: number[];
}
