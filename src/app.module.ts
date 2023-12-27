import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipTypeModule } from './modules/ship-type/ship-type.module';
import { ShipModule } from './modules/ship/ship.module';
import { RoomModule } from './modules/room/room.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { PartModule } from './modules/part/part.module';
import * as dotenv from 'dotenv';
import { MaterialModule } from './modules/material/material.module';
import { JobTypeModule } from './modules/job-type/job-type.module';
import { JobModule } from './modules/job/job.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TaskModule } from './modules/task/task.module';
import { LoggerMiddleware } from './common/middleware/LoggerMiddleware';
import { MenuModule } from './modules/menu/menu.module';
import { RolesModule } from './modules/roles/roles.module';
import { MaintenanceFormModule } from './modules/maintenance-form/maintenance-form.module';
import { MaintenancePlanModule } from './modules/maintenance-plan/maintenance-plan.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { MaintenanceRealizationModule } from './modules/maintenance-realization/maintenance-realization.module';
import { DamageReportingModule } from './modules/damage-reporting/damage-reporting.module';
import { UploadModule } from './modules/upload/upload.module';
import { GoodServicesModule } from './modules/good-services/good-services.module';

// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';
import { CommonModule } from './modules/common/common.module';
import { RepairmentModule } from './modules/repairment/repairment.module';
import { MaintenanceReportModule } from './modules/maintenance-report/maintenance-report.module';
import { InventoryModule } from './modules/inventory/inventory.module';

import { ConfigModule } from '@nestjs/config';

dotenv.config();

@Module({
  imports: [
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'storage/files'), // Replace 'public' with the folder containing your images
    //   serveRoot: '/files', // This will serve images under the '/images' URL path
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [],
      synchronize: true,
      // synchronize: process.env.NODE_ENV !== 'production' ? true : false,
      logging: false,
      logger: 'advanced-console',
      autoLoadEntities: true,
    }),
    ThrottlerModule.forRoot({
      ttl: 20,
      limit: 20,
    }),
    UsersModule,
    AuthModule,
    ShipTypeModule,
    ShipModule,
    RoomModule,
    EquipmentModule,
    PartModule,
    MaterialModule,
    JobTypeModule,
    JobModule,
    TaskModule,
    MenuModule,
    RolesModule,
    MaintenanceFormModule,
    MaintenancePlanModule,
    ApprovalModule,
    MaintenanceRealizationModule,
    DamageReportingModule,
    UploadModule,
    GoodServicesModule,
    CommonModule,
    RepairmentModule,
    MaintenanceReportModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
