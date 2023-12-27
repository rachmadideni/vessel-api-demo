import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Repairment } from './repairment.entity';

@Entity('repairment_photos')
export class RepairmentPhotos {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  photo: string;

  @ManyToOne(() => Repairment, (repairment) => repairment.repairmentPhotos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'repairmentId',
    referencedColumnName: 'id',
  })
  repairment: Repairment;

  @Column({
    unsigned: true,
    comment: 'photo size in bytes',
  })
  size: number;
}
