import { ApiProperty } from '@nestjs/swagger';

export class CreateRepairmentReasonsDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
