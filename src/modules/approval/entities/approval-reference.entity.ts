import { CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MaintenanceForm } from '../../maintenance-form/entities/maintenance-form.entity';

@Entity({
  name: 'approval_references',
})
export class ApprovalReference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => MaintenanceForm, (maintenanceForm) => maintenanceForm.id)
  maintenanceForm: MaintenanceForm;

  @ManyToOne(() => User, (user) => user.id)
  user: User;
}
