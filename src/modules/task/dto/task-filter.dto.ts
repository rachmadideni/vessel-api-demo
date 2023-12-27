import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class TaskFilterDto {
  @ApiProperty({
    example: 'job name',
    required: false,
  })
  @IsOptional()
  jobName?: string;
}
