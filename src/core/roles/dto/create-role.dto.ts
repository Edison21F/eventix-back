import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];
}