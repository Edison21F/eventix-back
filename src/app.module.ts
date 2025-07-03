import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { typeOrmConfig } from './config/database.orm';
import { mongooseConfig } from './config/database.mongose';
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

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig),
  MongooseModule.forRootAsync({
    useFactory: () => mongooseConfig
  }),
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
  ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
