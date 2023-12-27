import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { JobType } from '../../job-type/entities/job-type.entity';
import { Task } from '../../task/entities/task.entity';

@Entity({
  name: 'jobs',
})
export class Job {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => JobType, (jobType) => jobType.id)
  jobType: JobType;

  @OneToMany(() => Task, (task) => task.job)
  task: Task;
}
