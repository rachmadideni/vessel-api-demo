import { Module } from '@nestjs/common';
import { MaintenanceRealizationService } from './maintenance-realization.service';
import { MaintenanceRealizationController } from './maintenance-realization.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRealisation } from '../maintenance-plan/entities/maintenance-realisation.entity';
import { MaintenanceRealisationItem } from '../maintenance-plan/entities/maintenance-realisation-item.entity';
import { MaintenanceRealisationTask } from '../maintenance-plan/entities/maintenance-realisation-task.entity';
import { UsersModule } from '../users/users.module';
import { ApprovalModule } from '../approval/approval.module';
import { Approval } from '../approval/entities/approval.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRealisation, MaintenanceRealisationTask, MaintenanceRealisationItem, Approval, User]), UsersModule, ApprovalModule],
  controllers: [MaintenanceRealizationController],
  providers: [MaintenanceRealizationService],
})
export class MaintenanceRealizationModule {}
