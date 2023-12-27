import { Module } from '@nestjs/common';
import { MaintenanceReportController } from './maintenance-report.controller';
import { MaintenanceReportService } from './maintenance-report.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRealisation } from '../maintenance-plan/entities/maintenance-realisation.entity';
import { MaintenanceRealisationItem } from '../maintenance-plan/entities/maintenance-realisation-item.entity';
import { MaintenanceRealisationTask } from '../maintenance-plan/entities/maintenance-realisation-task.entity';
import { Approval } from '../approval/entities/approval.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { MaintenanceFormModule } from '../maintenance-form/maintenance-form.module';
import { ApprovalModule } from '../approval/approval.module';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRealisation, MaintenanceRealisationItem, MaintenanceRealisationTask, Approval, User]), UsersModule, MaintenanceFormModule, ApprovalModule],
  controllers: [MaintenanceReportController],
  providers: [MaintenanceReportService],
})
export class MaintenanceReportModule {}
