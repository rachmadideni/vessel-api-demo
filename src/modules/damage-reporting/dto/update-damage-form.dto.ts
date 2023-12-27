import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDamageFormDto } from './create-damage-form.dto';
import { IsOptional } from 'class-validator';

class deletedIds {
  damageTypes: string[];
  damageCauses: string[];
  damageRepairPlans: string[];
}

class updatedIdsKey {
  id: string;
  value: string;
}

class updatedIds {
  damageTypes: updatedIdsKey;
  damageCauses: updatedIdsKey;
  damageRepairPlans: updatedIdsKey;
}

export class UpdateDamageFormDto extends PartialType(CreateDamageFormDto) {
  @ApiProperty({ type: deletedIds, required: false, default: { damageTypes: ['string'], damageCauses: ['string'], damageRepairPlans: ['string'] } })
  @IsOptional()
  deletedIds?: deletedIds;

  @ApiProperty({
    type: updatedIds,
    required: false,
    default: {
      damageTypes: [
        {
          id: 'string',
          value: 'string',
        },
      ],
      damageCauses: [
        {
          id: 'string',
          value: 'string',
        },
      ],
      damageRepairPlans: [
        {
          id: 'string',
          value: 'string',
        },
      ],
    },
  })
  @IsOptional()
  updatedIds?: updatedIds;
}
