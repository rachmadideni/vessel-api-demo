import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Part } from 'src/modules/part/entities/part.entity';

export class GoodServicesItemDto {
  @ApiPropertyOptional()
  id?: string;

  @ApiProperty()
  usagePlanDate: Date;

  @ApiProperty()
  estimatedPartPrice: number;

  // @ApiProperty()
  // currentQuantity: number;

  @ApiProperty()
  orderedQuantity: number;

  // @ApiProperty()
  // partUnit: string;

  // @ApiProperty({ type: Part })
  @ApiProperty()
  partId: string;
  // partId: Part;

  // @ApiProperty()
  // partId: string;

  //   @ApiProperty()
  //   goodServicesId: string;
}
