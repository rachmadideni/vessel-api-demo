import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Ship } from '../../ship/entities/ship.entity';
import { Sections } from 'src/modules/common/entities/sections.entity';
import { RepairmentJobs } from './repairment-jobs.entity';
import { RepairmentPhotos } from './repairment-photos.entity';
import { RepairmentReasons } from './repairment-reasons.entity';
import { RepairmentApprovals } from './repairment-approvals.entity';
import { DamageReport } from 'src/modules/damage-reporting/entities/damage-report.entity';
import { RepairmentMaterials } from './repairment-materials.entity';
@Entity({
  name: 'repairments',
})
export class Repairment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  formNumber: string;

  @Column({
    comment: 'tanggal penyelesaian',
  })
  completionDate: Date;

  // @Column({
  //   comment: 'material / ukuran',
  // })
  // materialDesc: string;

  @Column()
  documentNumber: string;

  @Column()
  effectiveDate: Date;

  @Column()
  revision: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Ship, (ship) => ship.repairments, {
    eager: true,
  })
  ship: Ship;

  // Departemen
  @ManyToOne(() => Sections, (sections) => sections.id, {
    eager: true,
  })
  section: Sections;

  // Jenis Pekerjaan
  @OneToMany(() => RepairmentJobs, (repairmentJobs) => repairmentJobs.repairment, {
    eager: true,
  })
  repairmentJobs: RepairmentJobs[];

  // gambar penyelesaian pekerjaan
  @OneToMany(() => RepairmentPhotos, (repairmentPhotos) => repairmentPhotos.repairment, {
    eager: true,
  })
  repairmentPhotos: RepairmentPhotos[];

  // dasar pelaksanan / permintaan pekerjaan
  @OneToMany(() => RepairmentReasons, (repairmentReasons) => repairmentReasons.repairment, {
    eager: true,
  })
  repairmentReasons: RepairmentReasons[];

  @OneToMany(() => RepairmentApprovals, (repairmentApprovalsMeta) => repairmentApprovalsMeta.repairment, {
    eager: true,
  })
  repairmentApprovals: RepairmentApprovals[];

  // links to damage report
  @ManyToOne(() => DamageReport, (dmr) => dmr.id, {
    nullable: true,
    eager: true,
  })
  damageReport: DamageReport;

  // list material
  @OneToMany(() => RepairmentMaterials, (materials) => materials.repairment, {
    nullable: true,
    eager: true,
  })
  materials: RepairmentMaterials[];
}
