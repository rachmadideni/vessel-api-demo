import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Ship } from '../../ship/entities/ship.entity';
import { Job } from '../../job/entities/job.entity';
import { ApiProperty } from '@nestjs/swagger';
import { maintenancePeriod } from '../../../common/dto/maintenancePeriod.dto';
import { ApprovalReference } from '../../approval/entities/approval-reference.entity';

@Entity({
  name: 'maintenance_form',
})
export class MaintenanceForm {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  @ApiProperty()
  id: string;

  @Index()
  @Column()
  @ApiProperty()
  documentNumber: string;

  @Column()
  @ApiProperty()
  revisionNumber: string;

  @Column({
    type: 'date',
  })
  @ApiProperty()
  formDate: Date;

  @Column({
    type: 'enum',
    enum: maintenancePeriod,
    default: null,
  })
  maintenancePeriod: maintenancePeriod;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Ship, (ship) => ship.id)
  ship: Ship;

  @ManyToOne(() => Job, (job) => job.id)
  job: Job;

  @OneToMany(() => ApprovalReference, (approvalReference) => approvalReference.maintenanceForm)
  approvalReferences: ApprovalReference[];
}
