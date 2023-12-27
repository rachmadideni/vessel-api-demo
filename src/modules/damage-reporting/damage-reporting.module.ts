import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DamageReport } from './entities/damage-report.entity';
import { DamageType } from './entities/damage-type.entity';
import { DamageCause } from './entities/damage-cause.entity';
import { DamageRepairPlan } from './entities/damage-repair-plan.entity';
import { DamagePhotos } from './entities/damage-photos.entity';
import { Ship } from '../ship/entities/ship.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { DamageReportApprovals } from './entities/damage-report-approvals.entity';
import { DamageReportingController } from './damage-reporting.controller';
import { DamageReportingService } from './damage-reporting.service';

import { UploadModule } from '../upload/upload.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([DamageReport, DamageType, DamageCause, DamageRepairPlan, DamagePhotos, Ship, DamageReportApprovals, User, Role]), UploadModule, UsersModule],
  controllers: [DamageReportingController],
  providers: [DamageReportingService],
})
export class DamageReportingModule {}
