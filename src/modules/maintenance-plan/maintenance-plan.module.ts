import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRealisation } from './entities/maintenance-realisation.entity';
import { MaintenanceRealisationTask } from './entities/maintenance-realisation-task.entity';
import { MaintenanceRealisationItem } from './entities/maintenance-realisation-item.entity';
import { UsersModule } from '../users/users.module';
import { MaintenanceFormModule } from '../maintenance-form/maintenance-form.module';
import { MaintenancePlanController } from './maintenance-plan.controller';
import { MaintenancePlanService } from './maintenance-plan.service';
import { ApprovalModule } from '../approval/approval.module';
import { Approval } from '../approval/entities/approval.entity';
import { Task } from '../task/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRealisation, MaintenanceRealisationTask, MaintenanceRealisationItem, Approval, Task]), MaintenanceFormModule, UsersModule, ApprovalModule],
  controllers: [MaintenancePlanController],
  providers: [MaintenancePlanService],
})
export class MaintenancePlanModule {}
