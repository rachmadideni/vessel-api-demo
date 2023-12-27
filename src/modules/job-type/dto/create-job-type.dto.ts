import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateJobTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
}
