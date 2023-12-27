import { ApiProperty } from '@nestjs/swagger';

export class ApprovalsKeyValues {
  userId: string;
  roleId: string;
  order: number;
  desc: string;
}

const GS_APPROVALS = [
  {
    userId: 'string-user-id',
    roleId: '8ed75a97-a790-4ca2-8567-11fa22e1437e',
    order: 1,
    desc: 'Di Setujui (DEPT./BAGIAN TERKAIT) *',
  },
  {
    userId: 'string-user-id',
    roleId: '2c9bb681-8c91-4fe6-bc19-e299816def88',
    order: 2,
    desc: 'Di Periksa (PURCHASING/GA) *',
  },
];

export class GsApprovalsDto {
  @ApiProperty({
    default: [...GS_APPROVALS],
  })
  approvals: ApprovalsKeyValues[];
}
