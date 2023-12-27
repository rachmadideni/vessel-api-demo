import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Repairment } from './repairment.entity';
import { RepairmentJobDetails } from './repairment-job-details.entity';

@Entity('repairment_jobs')
export class RepairmentJobs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Repairment, (repair) => repair.repairmentJobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'repairmentId',
    referencedColumnName: 'id',
  })
  repairment: Repairment;

  @OneToMany(() => RepairmentJobDetails, (rpj) => rpj.repairmentJob, {
    eager: true,
  })
  details: RepairmentJobDetails[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
