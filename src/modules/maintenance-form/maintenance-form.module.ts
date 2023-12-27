import { Module } from '@nestjs/common';
import { MaintenanceFormService } from './maintenance-form.service';
import { MaintenanceFormController } from './maintenance-form.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceForm } from './entities/maintenance-form.entity';
import { ShipModule } from '../ship/ship.module';
import { JobModule } from '../job/job.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceForm]), ShipModule, JobModule, UsersModule],
  controllers: [MaintenanceFormController],
  providers: [MaintenanceFormService],
  exports: [MaintenanceFormService],
})
export class MaintenanceFormModule {}
