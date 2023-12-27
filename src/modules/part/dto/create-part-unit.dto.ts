import { ApiProperty } from '@nestjs/swagger';

export class CreatePartUnitDto {
  @ApiProperty()
  name: string;
}
