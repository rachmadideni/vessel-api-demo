import { ApiProperty } from '@nestjs/swagger';

class DmrUpdateApprovals {
  @ApiProperty()
  id: number;
  @ApiProperty()
  userId: string;
  @ApiProperty()
  roleId: string;
  @ApiProperty()
  order: number;
  @ApiProperty()
  desc: string;
}

const SAMPLE_DATA = [
  {
    id: 23,
    userId: `8ed75a97-a790-4ca2-8567-11fa22e1437e`,
    roleId: '8ed75a97-a790-4ca2-8567-11fa22e1437e',
    order: 1,
    desc: `dibuat oleh`,
  },
  {
    id: 24,
    userId: `2c9bb681-8c91-4fe6-bc19-e299816def88`,
    roleId: '8ed75a97-a790-4ca2-8567-11fa22e1437e',
    order: 2,
    desc: `diperiksa oleh`,
  },
  {
    id: 25,
    userId: `2c9bb681-8c91-4fe6-bc19-e299816def88`,
    roleId: '8ed75a97-a790-4ca2-8567-11fa22e1437e',
    order: 3,
    desc: `disetujui oleh`,
  },
];

export class UpdateDmrApprovalsDto {
  @ApiProperty({ type: [DmrUpdateApprovals], default: [...SAMPLE_DATA] })
  approvals: DmrUpdateApprovals[];
}
