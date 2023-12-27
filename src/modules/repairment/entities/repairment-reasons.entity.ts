import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Repairment } from './repairment.entity';
import { CommonRepairmentReasons } from 'src/modules/common/entities/repairment-reasons.entity';

@Entity('repairment_reasons')
export class RepairmentReasons {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: true,
  })
  reasonDate: Date;

  @Column({
    nullable: true,
  })
  reasonNumber: string;

  @Column({
    default: false,
  })
  active: boolean;

  @ManyToOne(() => Repairment, (repairment) => repairment.repairmentReasons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'repairmentId',
    referencedColumnName: 'id',
  })
  repairment: Repairment;

  @ManyToOne(() => CommonRepairmentReasons, (cmr) => cmr.id, {
    eager: true,
  })
  @JoinColumn({
    name: 'commonRepairmentReasonId',
    referencedColumnName: 'id',
  })
  commonRepairmentReason: CommonRepairmentReasons;
}
