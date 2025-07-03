import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../models/core/user.entity';
import { UserRole } from '../../models/core/user-role.entity';
import { Role } from '../../models/core/role.entity';
import { UserPersonalData, UserPersonalDataSchema } from '../../models/core/user-personal-data.schema';
import { EncryptionService } from '../../services/encryption.service';
import { UserPersonalDataService } from '../../services/user-personal-data.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, Role]),
    MongooseModule.forFeature([
      { name: UserPersonalData.name, schema: UserPersonalDataSchema }
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService, EncryptionService, UserPersonalDataService],
  exports: [UsersService, UserPersonalDataService],
})
export class UsersModule {}