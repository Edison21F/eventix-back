import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto, PersonalDataDto } from './create-user.dto';
import { IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePersonalDataDto extends PartialType(PersonalDataDto) {}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePersonalDataDto)
  personalData?: UpdatePersonalDataDto;
}