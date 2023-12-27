import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateRepairmentDto, reasonKeyValues } from './create-repairment.dto';
import { NestedJobs, nestedJobsKeyValues, materials } from './create-repairment.dto';

class deletedIds {
  jobId: string[];
  jobDetailId: string[];
  materialsId: string[];
}

class JobKeyValues {
  id: string;
  name: string;
}

class newJobKeyValues {
  id: string;
  name: string;
  details: JobKeyValues[];
}

class materialKeyValues {
  id: string;
  partId: string;
}

class updatedIds {
  jobs: newJobKeyValues;
  materials: materialKeyValues;
}

export class UpdateRepairmentDto extends PartialType(CreateRepairmentDto) {
  @ApiProperty({
    type: reasonKeyValues,
    required: false,
    default: [],
  })
  reasons?: reasonKeyValues[];

  @IsOptional()
  @ApiProperty({
    default: [...NestedJobs],
  })
  jobs?: nestedJobsKeyValues[];

  @ApiProperty({
    type: deletedIds,
    required: false,
    default: {
      jobId: ['string'],
      jobDetailId: ['string'],
      materialsId: ['string'],
    },
  })
  @IsOptional()
  deletedIds: deletedIds;

  @ApiProperty({
    type: updatedIds,
    default: {
      jobs: [
        {
          id: 'string',
          name: 'string',
          details: [
            {
              id: 'string',
              name: 'string',
            },
          ],
        },
      ],
      materials: [
        {
          id: 'string',
          partId: 'string',
        },
      ],
    },
  })
  updatedIds: updatedIds;
}
