import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { DamageReport } from 'src/modules/damage-reporting/entities/damage-report.entity';
import { GoodServicesItem } from './good-services-item.entity';
import { Ship } from 'src/modules/ship/entities/ship.entity';
import { Sections } from 'src/modules/common/entities/sections.entity';
import { GoodServicesApprovals } from './good-services-approvals';
import { User } from 'src/modules/users/entities/user.entity';
@Entity({
  name: 'good_services',
})
export class GoodServices {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ship, (ship) => ship.goodServices, {
    eager: true,
  })
  vessel: Ship;

  // @OneToOne(() => DamageReport, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn()
  // referenceNumber: DamageReport;

  @ManyToOne(() => DamageReport, (dmr) => dmr.goodServices)
  referenceNumber: DamageReport;

  // @OneToOne(() => Sections, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn()
  // section: Sections;

  @ManyToOne(() => Sections, (section) => section.goodServices, {
    eager: true,
  })
  section: Sections;

  @OneToMany(() => GoodServicesItem, (goodServicesItem) => goodServicesItem.goodServices, {
    eager: true,
  })
  items: GoodServicesItem[];

  @Column()
  effectiveDate: Date;

  @Column()
  proposedDate: Date;

  @Column()
  formNumber: string;

  @Column()
  documentNumber: string;

  @Column()
  notes: string;

  @OneToMany(() => GoodServicesApprovals, (approvals) => approvals.goodServices, {
    eager: true,
  })
  approvals: GoodServicesApprovals[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({
    nullable: true,
  })
  createdBy: string;
}
