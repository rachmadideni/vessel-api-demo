import { ApiProperty } from '@nestjs/swagger';

export class RepairmentUpdateApprovals {
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

const mockApprovals = [
  {
    id: 23,
    userId: `8ed75a97-a790-4ca2-8567-11fa22e1437e`,
    roleId: `8ed75a97-a790-4ca2-8567-11fa22e1437e`,
    order: 1,
    desc: `dibuat oleh`,
  },
  {
    id: 24,
    userId: `2c9bb681-8c91-4fe6-bc19-e299816def88`,
    roleId: `2c9bb681-8c91-4fe6-bc19-e299816def88`,
    order: 2,
    desc: `diperiksa oleh`,
  },
];

export class UpdateRepairmentApprovalsDto {
  @ApiProperty({
    type: [RepairmentUpdateApprovals],
    default: [...mockApprovals],
  })
  approvals: RepairmentUpdateApprovals[];
}
