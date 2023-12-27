import { ApiProperty } from '@nestjs/swagger';

export class PlanDateDto {
  @ApiProperty({
    example: 'ID Task',
  })
  idTask: string;

  @ApiProperty({
    example: 'YYYY-MM-DD',
  })
  planDate: Date;
}
