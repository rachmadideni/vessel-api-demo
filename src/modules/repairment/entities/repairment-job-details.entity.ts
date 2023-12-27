import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RepairmentJobs } from './repairment-jobs.entity';

@Entity('repairment_job_details')
export class RepairmentJobDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => RepairmentJobs, (parent) => parent.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'repairmentJobId',
    referencedColumnName: 'id',
  })
  repairmentJob: RepairmentJobs;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
