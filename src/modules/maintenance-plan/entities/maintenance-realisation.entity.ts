import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Ship } from '../../ship/entities/ship.entity';
import { Job } from '../../job/entities/job.entity';
import { MaintenanceRealisationTask } from './maintenance-realisation-task.entity';
import { MaintenanceForm } from '../../maintenance-form/entities/maintenance-form.entity';
import { Approval } from '../../approval/entities/approval.entity';

@Entity({
  name: 'maintenance_realisation',
})
export class MaintenanceRealisation {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Index()
  @Column()
  shipName: string;

  @Index()
  @Column()
  maintenancePeriod: string;

  @Index()
  @Column()
  jobName: string;

  @Index()
  @Column()
  formNumber: string;

  @Index()
  @Column({
    nullable: true,
  })
  formDate: string;

  @Index()
  @Column()
  documentNumber: string;

  @Column()
  revisionNumber: string;

  @Column()
  realisation: string;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Progress', 'Approved', 'Rejected'],
  })
  statusPlan: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: ['Pending', 'Progress', 'Approved', 'Rejected'],
  })
  statusRealisation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Ship, (ship) => ship.id)
  ship: Ship;

  @ManyToOne(() => Job, (job) => job.id)
  job: Job;

  @ManyToOne(() => MaintenanceForm, (maintenanceForm) => maintenanceForm.id)
  maintenanceForm: MaintenanceForm;

  @OneToMany(() => MaintenanceRealisationTask, (maintenanceRealisationTask) => maintenanceRealisationTask.maintenanceRealisation)
  maintenancePlanTask: MaintenanceRealisationTask;

  @OneToOne(() => Approval, (approval) => approval.maintenance)
  @JoinTable({
    name: 'approvals',
    joinColumn: {
      name: 'id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'maintenanceId',
      referencedColumnName: 'maintenanceId',
    },
  })
  approval: Approval;
}
