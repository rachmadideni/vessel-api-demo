import { IsNotEmpty } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RepairmentApprovals {
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
];

export class CreateRepairmentApprovalsDto {
  @ApiProperty({
    type: [RepairmentApprovals],
    default: [...mockApprovals],
  })
  approvals: RepairmentApprovals[];
}
