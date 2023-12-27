import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateGoodServicesDto } from './create-good-services.dto';

class ItemKeyValues {
  id: string;
  usagePlanDate: Date;
  estimatedPartPrice: number;
  partId: string;
  orderedQuantity: number;
}
class updatedIds {
  items: ItemKeyValues[];
}

export class UpdateGoodServicesDto extends PartialType(CreateGoodServicesDto) {
  @ApiProperty()
  deletedIds?: string[];

  @ApiProperty({
    type: updatedIds,
    required: false,
    default: {
      items: [
        {
          id: 'string',
          usagePlanDate: new Date(),
          estimatedPartPrice: 0,
          partId: 'string',
          orderedQuantity: 0,
        },
      ],
    },
  })
  updatedIds?: updatedIds;
}
