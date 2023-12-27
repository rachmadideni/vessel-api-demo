import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';
import { GoodServices } from './good-services.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('good_services_approvals')
export class GoodServicesApprovals {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order: number;

  @Column()
  desc: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Role, (role) => role.id)
  role: Role;

  @ManyToOne(() => GoodServices, (gs) => gs.approvals, {
    onDelete: 'CASCADE',
  })
  goodServices: GoodServices;
}
