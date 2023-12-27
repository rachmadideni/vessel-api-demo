import { Module } from '@nestjs/common';
import { RepairmentController } from './repairment.controller';
import { RepairmentService } from './repairment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repairment } from './entities/repairment.entity';
import { RepairmentJobs } from './entities/repairment-jobs.entity';
import { RepairmentJobDetails } from './entities/repairment-job-details.entity';
import { RepairmentPhotos } from './entities/repairment-photos.entity';
import { RepairmentReasons } from './entities/repairment-reasons.entity';
import { RepairmentApprovals } from './entities/repairment-approvals.entity';
import { RepairmentMaterials } from './entities/repairment-materials.entity';
import { Ship } from '../ship/entities/ship.entity';
import { Sections } from '../common/entities/sections.entity';
import { CommonRepairmentReasons } from '../common/entities/repairment-reasons.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { DamageReport } from '../damage-reporting/entities/damage-report.entity';
import { Part } from '../part/entities/part.entity';
import { UploadModule } from '../upload/upload.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Repairment,
      RepairmentJobs,
      RepairmentJobDetails,
      RepairmentPhotos,
      RepairmentReasons,
      RepairmentApprovals,
      RepairmentMaterials,
      Ship,
      Sections,
      CommonRepairmentReasons,
      User,
      Role,
      DamageReport,
      Part,
    ]),
    UploadModule,
    UsersModule,
  ],
  controllers: [RepairmentController],
  providers: [RepairmentService],
})
export class RepairmentModule {}
