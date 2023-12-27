import { Module } from '@nestjs/common';
import { JobTypeService } from './job-type.service';
import { JobTypeController } from './job-type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobType } from './entities/job-type.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([JobType]), UsersModule],
  controllers: [JobTypeController],
  providers: [JobTypeService],
  exports: [JobTypeService],
})
export class JobTypeModule {}
