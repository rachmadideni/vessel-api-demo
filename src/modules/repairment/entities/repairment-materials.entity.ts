import { Entity, OneToOne, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Part } from 'src/modules/part/entities/part.entity';
import { Repairment } from './repairment.entity';

@Entity('repairment_materials')
export class RepairmentMaterials {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Part, (part) => part.id, {
    nullable: true,
    eager: true,
  })
  part: Part;

  @ManyToOne(() => Repairment, (repairment) => repairment.materials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'repairmentId',
    referencedColumnName: 'id',
  })
  repairment: Repairment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
