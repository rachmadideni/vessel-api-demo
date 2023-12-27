import { Module } from '@nestjs/common';
import { PartService } from './part.service';
import { PartController } from './part.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Part } from './entities/part.entity';
import { PartUnit } from './entities/part-unit.entity';
import { ShipModule } from '../ship/ship.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Part, PartUnit]), ShipModule, EquipmentModule, UsersModule],
  controllers: [PartController],
  providers: [PartService],
})
export class PartModule {}
