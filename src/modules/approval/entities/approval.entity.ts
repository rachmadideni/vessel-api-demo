import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MaintenanceRealisation } from '../../maintenance-plan/entities/maintenance-realisation.entity';
import { StatusApproval } from '../../../common/dto/statusApproval.dto';

@Entity({
  name: 'approvals',
})
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: StatusApproval,
    default: StatusApproval.Pending,
  })
  status: string;

  @Column({
    nullable: true,
  })
  notes: string;

  @Column()
  userFirstName: string;

  @Column({
    nullable: true,
  })
  userLastName: string;

  @Column({
    nullable: true,
  })
  userTitle: string;

  @Column()
  approvalType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => MaintenanceRealisation, (maintenanceRealisation) => maintenanceRealisation.id)
  maintenance: MaintenanceRealisation;

  currentApprovalUser: boolean;
}
