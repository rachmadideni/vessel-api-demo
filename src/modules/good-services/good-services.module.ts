import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodServicesController } from './good-services.controller';
import { GoodServicesService } from './good-services.service';
import { GoodServices } from './entities/good-services.entity';
import { GoodServicesItem } from './entities/good-services-item.entity';
import { GoodServicesApprovals } from './entities/good-services-approvals';
import { DamageReport } from '../damage-reporting/entities/damage-report.entity';
import { Part } from '../part/entities/part.entity';
import { Ship } from '../ship/entities/ship.entity';
import { Sections } from '../common/entities/sections.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([GoodServices, GoodServicesItem, GoodServicesApprovals, DamageReport, Part, Ship, Sections, Role, User]), UsersModule],
  controllers: [GoodServicesController],
  providers: [GoodServicesService],
})
export class GoodServicesModule {}
