import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { typeOrmConfig } from './config/database.orm';
import { mongooseConfig } from './config/database.mongose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users.module';
import { RolesModule } from './modules/roles.module';
import { PermissionsModule } from './modules/permissions.module';
import { EventsModule } from './modules/events.module';
import { MoviesModule } from './modules/movies.module';
import { ScreeningsModule } from './modules/screenings.module';
import { RoomsModule } from './modules/rooms.module';
import { ConcertsModule } from './modules/concerts.module';
import { RoutesModule } from './modules/routes.module';
import { SchedulesModule } from './modules/schedules.module';
import { OrdersModule } from './modules/orders.module';
import { PaymentsModule } from './modules/payments.module';
import { ReportsModule } from './modules/reports.module';
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
import { RefundsModule } from './modules/refunds.module';
import { Order } from './models/sales/order.entity';
import { OrderItem } from './models/sales/order-item.entity';
import { Payment } from './models/sales/payment.entity';
import { Refund } from './models/sales/refund.entity';
import { TicketType } from './models/events/ticket-type.entity';
import { SalesInitializationService } from './services/SalesInitializationService';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([Order, OrderItem, Payment, Refund, User, TicketType, Event, Role, Permission, RolePermission, UserRole]),
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
    ReportsModule,
    RefundsModule
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    DatabaseMonitorService, 
    EncryptionService,
  ],
})
export class AppModule { }