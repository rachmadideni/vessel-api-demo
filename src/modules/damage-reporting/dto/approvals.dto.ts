import { ApiProperty } from '@nestjs/swagger';

class ApprovalsKeyValues {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  roleId: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  desc: string;
}

const APPROVALS = [
  {
    userId: `8ed75a97-a790-4ca2-8567-11fa22e1437e`,
    roleId: `8ed75a97-a790-4ca2-8567-11fa22e1437e`,
    order: 1,
    desc: `dibuat oleh`,
  },
  {
    userId: `2c9bb681-8c91-4fe6-bc19-e299816def88`,
    roleId: `2c9bb681-8c91-4fe6-bc19-e299816def88`,
    order: 2,
    desc: `diperiksa oleh`,
  },
  {
    userId: `2c9bb681-8c91-4fe6-bc19-e299816def88`,
    roleId: `2c9bb681-8c91-4fe6-bc19-e299816def88`,
    order: 3,
    desc: `disetujui oleh`,
  },
];

export class ApprovalsDto {
  @ApiProperty({
    type: [ApprovalsKeyValues],
    default: [...APPROVALS],
  })
  approvals: ApprovalsKeyValues[];
}
