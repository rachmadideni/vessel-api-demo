import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DamageReport } from './damage-report.entity';

@Entity({
  name: 'damage_photos',
})
export class DamagePhotos {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  photo: string;

  @ManyToOne(() => DamageReport, (damageReport) => damageReport.damagePhoto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'damageReportId',
    referencedColumnName: 'id',
  })
  damageReport: DamageReport;

  @Column({
    unsigned: true,
    comment: 'photo size in bytes',
  })
  size: number;
}
