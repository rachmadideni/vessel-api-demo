import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;
}
