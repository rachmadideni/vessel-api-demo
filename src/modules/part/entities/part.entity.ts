import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Ship } from '../../ship/entities/ship.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { PartCategory } from 'src/common/dto/partCategory.dto';
import { PartUnit } from './part-unit.entity';

@Entity({
  name: 'parts',
})
export class Part {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Column()
  number: string;

  @Column({
    nullable: true,
  })
  description: string;

  @Column()
  type: string;

  @Column()
  grade: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  specification: string;

  @Column({
    type: 'enum',
    enum: PartCategory,
    default: null,
    comment: 'Part category. 1=Part, 2=Material',
  })
  category: PartCategory;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date;

  @ManyToOne(() => Ship, (ship) => ship.id)
  ship: Ship;

  @ManyToOne(() => Equipment, (equipment) => equipment.id)
  equipment: Equipment;

  @ManyToOne(() => PartUnit, (partUnit) => partUnit.id)
  partUnit: PartUnit;

  @Column({
    nullable: true,
  })
  comment: string;
}
