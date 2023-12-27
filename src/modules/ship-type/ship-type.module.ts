import { Module } from '@nestjs/common';
import { ShipTypeService } from './ship-type.service';
import { ShipTypeController } from './ship-type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipType } from './entities/ship-type.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShipType]), UsersModule],
  controllers: [ShipTypeController],
  providers: [ShipTypeService],
  exports: [ShipTypeService],
})
export class ShipTypeModule {}
