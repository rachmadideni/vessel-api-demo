import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Repairment } from './repairment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
@Entity('repairment_approvals')
export class RepairmentApprovals {
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

  @ManyToOne(() => Repairment, (repairment) => repairment.repairmentApprovals)
  repairment: Repairment;
}
