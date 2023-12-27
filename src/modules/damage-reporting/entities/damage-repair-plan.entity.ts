import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DamageReport } from './damage-report.entity';

@Entity({
  name: 'damage_repair_plans',
})
export class DamageRepairPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => DamageReport, (dmr) => dmr.damageRepairPlan, {
    onDelete: 'CASCADE',
  })
  damageReport: DamageReport;

  @CreateDateColumn({
    select: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    select: false,
  })
  updatedAt: Date;
}
