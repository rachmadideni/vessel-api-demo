import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Ship } from 'src/modules/ship/entities/ship.entity';
import { DamageType } from './damage-type.entity';
import { DamageCause } from './damage-cause.entity';
import { DamageRepairPlan } from './damage-repair-plan.entity';
import { DamagePhotos } from './damage-photos.entity';
import { DamageReportApprovals } from './damage-report-approvals.entity';
import { Transform } from 'class-transformer';
import { GoodServices } from 'src/modules/good-services/entities/good-services.entity';
import { Inventory } from 'src/modules/inventory/entities/inventory.entity';
@Entity({
  name: 'damage_reports',
})
export class DamageReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ship, (ship) => ship.damageReports, {
    eager: true,
  })
  ship: Ship;

  @Column({
    comment: 'tanggal pelaporan',
  })
  @Transform(({ value }) => value.toISOString())
  reportDate: Date;

  @Column()
  @Transform(({ value }) => value.toISOString())
  effectiveDate: Date;

  @Column({
    comment: 'tanggal kejadian',
  })
  @Transform(({ value }) => value.toISOString())
  eventDate: Date;

  @Column()
  revision: string;

  @Column({
    unique: true,
  })
  formNumber: string;

  @Column()
  documentNumber: string;

  @Column({
    comment: 'pelabuhan',
  })
  port: string;

  // damageType: array string;
  @OneToMany(() => DamageType, (damageType) => damageType.damageReport, {
    eager: true,
  })
  damageType: DamageType[];

  // damageCause: array string;
  @OneToMany(() => DamageCause, (damageCause) => damageCause.damageReport, {
    eager: true,
  })
  damageCause: DamageCause[];

  // plannedAction: array string;
  @OneToMany(() => DamageRepairPlan, (damageRepairPlan) => damageRepairPlan.damageReport, {
    eager: true,
  })
  damageRepairPlan: DamageRepairPlan[];

  @OneToMany(() => DamagePhotos, (photo) => photo.damageReport, {
    eager: true,
  })
  damagePhoto: DamagePhotos[];

  @Column({
    comment: 'catatan tambahan',
  })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => DamageReportApprovals, (approvals) => approvals.damageReport, {
    eager: true,
  })
  approvals: DamageReportApprovals[];

  @OneToMany(() => GoodServices, (goodServices) => goodServices.referenceNumber, {
    eager: true,
  })
  goodServices: GoodServices[];

  @OneToMany(() => Inventory, (inventory) => inventory.referenceNumber)
  inventory: Inventory[];
}
