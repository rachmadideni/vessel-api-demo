import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { Sections } from './entities/sections.entity';
import { CommonRepairmentReasons } from './entities/repairment-reasons.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Sections, CommonRepairmentReasons])],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}
