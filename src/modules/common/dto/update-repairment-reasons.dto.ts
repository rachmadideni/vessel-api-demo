import { ApiProperty } from '@nestjs/swagger';
export class UpdateRepairmentReasonsDto {
  @ApiProperty()
  name: string;
}
