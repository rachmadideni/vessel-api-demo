import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DamageReport } from './damage-report.entity';

@Entity({
  name: 'damage_causes',
})
export class DamageCause {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => DamageReport, (damageType) => damageType.damageCause, {
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
