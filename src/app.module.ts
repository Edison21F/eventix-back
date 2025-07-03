import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { typeOrmConfig } from './config/database.orm';
import { mongooseConfig } from './config/database.mongose';
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './core/users/users.module';
import { RolesModule } from './core/roles/roles.module';
import { PermissionsModule } from './core/permissions/permissions.module';
import { EventsModule } from './events/events.module';
import { MoviesModule } from './cinema/movies/movies.module';
import { ScreeningsModule } from './cinema/screenings/screenings.module';
import { RoomsModule } from './cinema/rooms/rooms.module';
import { ConcertsModule } from './concerts/concerts.module';
import { RoutesModule } from './transport/routes/routes.module';
import { SchedulesModule } from './transport/schedules/schedules.module';
import { OrdersModule } from './sales/orders/orders.module';
import { PaymentsModule } from './sales/payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { DatabaseMonitorService } from './services/databaseMonitoreo.service';
import { InitializationService } from './services/initialization.service';
import { EncryptionService } from './services/encryption.service';
// Importar entidades para el servicio de inicialización
import { User } from './models/core/user.entity';
import { Role } from './models/core/role.entity';
import { Permission } from './models/core/permission.entity';
import { RolePermission } from './models/core/role-permission.entity';
import { UserRole } from './models/core/user-role.entity';
import { EventInitializationService } from './services/EventInitializationService';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, Role, Permission, RolePermission, UserRole]),
    MongooseModule.forRootAsync({
      useFactory: () => mongooseConfig
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    EventsModule,
    MoviesModule,
    ScreeningsModule,
    RoomsModule,
    ConcertsModule,
    RoutesModule,
    SchedulesModule,
    OrdersModule,
    PaymentsModule,
    ReportsModule
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    DatabaseMonitorService, 
    InitializationService,
    EncryptionService
  ],
})
export class AppModule { }