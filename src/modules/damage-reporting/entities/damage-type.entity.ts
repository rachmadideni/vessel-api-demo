import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DamageReport } from './damage-report.entity';

@Entity({
  name: 'damage_types',
})
export class DamageType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => DamageReport, (DamageReport) => DamageReport.damageType, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'damageReportId',
    referencedColumnName: 'id',
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
