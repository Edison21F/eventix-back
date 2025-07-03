import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  codeName: string;

  @IsString()
  displayName: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;
}