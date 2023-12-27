import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Approval } from './entities/approval.entity';
import { ApprovalReference } from './entities/approval-reference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Approval, ApprovalReference])],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
