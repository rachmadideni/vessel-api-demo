import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class reasonKeyValues {
  id: string;
  commonRepairmentReasonsId: number;
  date: Date;
  number: string;
  active: boolean;
}

const MockReasons = [1, 2, 3, 4, 5].map((item) => ({
  commonRepairmentReasonsId: item,
  date: new Date(),
  number: `NUMBER 00${item}`,
  active: true,
}));

export class nestedJobsKeyValues {
  name: string;
  details: string[];
}

export const NestedJobs = [
  {
    name: 'job 1',
    details: ['uraian 1', 'uraian 2'],
  },
];

export class materials {
  partId: string;
}

export class CreateRepairmentDto {
  @IsNotEmpty()
  @ApiProperty({
    default: '1a8ada62-21a2-4221-8c35-63c1b450fa49',
  })
  shipId: string;

  @IsNotEmpty()
  @ApiProperty({
    default: '6eb01ec2-d055-4232-8639-05b27a976045',
  })
  sectionId: string;

  @ApiProperty()
  damageReportId: string;

  @IsNotEmpty()
  @ApiProperty({
    default: 'FORM PERBAIKAN 001',
  })
  formNumber: string;

  @IsNotEmpty()
  @ApiProperty()
  completionDate: Date;

  // @IsNotEmpty()
  // @ApiProperty({
  //   default: 'Spare part terpasang stok kapal yang lama',
  // })
  // materialDesc: string;

  @IsNotEmpty()
  @ApiProperty({
    default: 'BLT-1. 10.0-01.3-07',
  })
  documentNumber: string;

  @IsNotEmpty()
  @ApiProperty()
  effectiveDate: Date;

  @IsNotEmpty()
  @ApiProperty({
    default: '08',
  })
  revision: string;

  @ApiProperty({
    type: reasonKeyValues,
    required: false,
    default: [...MockReasons],
  })
  reasons: reasonKeyValues[];

  @IsNotEmpty()
  @ApiProperty({
    default: [...NestedJobs],
  })
  jobs: nestedJobsKeyValues[];

  @IsNotEmpty()
  @ApiProperty({
    default: ['partId'],
  })
  // materials: materials[];
  materials: string[];
}
