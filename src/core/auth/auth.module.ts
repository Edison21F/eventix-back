import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategies';
import { User } from '../../models/core/user.entity';
import { UserPersonalData, UserPersonalDataSchema } from '../../models/core/user-personal-data.schema';
import { EncryptionService } from '../../services/encryption.service';
import { UserPersonalDataService } from '../../services/user-personal-data.service';
import { key } from '../../config/key';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MongooseModule.forFeature([
      { name: UserPersonalData.name, schema: UserPersonalDataSchema }
    ]),
    PassportModule,
    JwtModule.register({
      secret: key.jwt.secret,
      signOptions: { expiresIn: key.jwt.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy, 
    EncryptionService,
    UserPersonalDataService
  ],
  exports: [AuthService, EncryptionService, UserPersonalDataService],
})
export class AuthModule {}