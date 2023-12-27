import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { GoodServicesItemDto } from './create-good-services-item.dto';

export class CreateGoodServicesDto {
  @IsNotEmpty()
  @ApiProperty()
  vesselId: string;

  @IsNotEmpty()
  @ApiProperty()
  documentNumber: string;

  @IsNotEmpty()
  @ApiProperty()
  formNumber: string;

  // @IsNotEmpty()
  // @ApiProperty()
  // referenceNumber: string;

  @IsNotEmpty()
  @ApiProperty()
  effectiveDate: Date;

  @IsNotEmpty()
  @ApiProperty()
  proposedDate: Date;

  @IsNotEmpty()
  @ApiProperty()
  sectionId: string;

  // @IsNotEmpty()
  // @ApiProperty()
  // damageReportId: string;

  @IsNotEmpty()
  @ApiProperty({
    type: [GoodServicesItemDto],
    required: true,
  })
  items: GoodServicesItemDto[];

  @IsNotEmpty()
  @ApiProperty()
  notes: string;
}
