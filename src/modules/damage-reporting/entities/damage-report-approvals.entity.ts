import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { DamageReport } from './damage-report.entity';
import { Role } from 'src/modules/roles/entities/role.entity';

@Entity('damage_report_approvals')
export class DamageReportApprovals {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order: number;

  @Column()
  desc: string;

  @ManyToOne(() => User, (user) => user.id, {
    eager: true,
  })
  user: User;

  @ManyToOne(() => Role, (role) => role.id, {
    eager: true,
  })
  role: Role;

  @ManyToOne(() => DamageReport, (dmr) => dmr.approvals, {
    onDelete: 'CASCADE',
  })
  damageReport: DamageReport;
}
