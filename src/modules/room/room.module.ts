import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { TreeRepository } from 'typeorm';
import { ShipModule } from '../ship/ship.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), ShipModule, UsersModule],
  controllers: [RoomController],
  providers: [RoomService, TreeRepository],
  exports: [RoomService],
})
export class RoomModule {}
