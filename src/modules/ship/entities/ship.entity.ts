import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShipType } from '../../ship-type/entities/ship-type.entity';
import { Repairment } from '../../repairment/entities/repairment.entity';
import { DamageReport } from 'src/modules/damage-reporting/entities/damage-report.entity';
import { GoodServices } from 'src/modules/good-services/entities/good-services.entity';
import { Inventory } from 'src/modules/inventory/entities/inventory.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({
  name: 'ships',
})
export class Ship {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  @ApiProperty()
  id: string;

  @Index()
  @Column()
  @ApiProperty()
  name: string;

  @Column()
  @ApiProperty()
  callSign: string;

  @Column({
    nullable: true,
  })
  @ApiProperty()
  imoNumber: string;

  @Column({
    nullable: true,
  })
  @ApiProperty()
  mmssiNumber: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  @ApiProperty()
  yearBuild: string;

  @Column({
    nullable: true,
  })
  @ApiProperty()
  grossTonnage: string;

  @Column({
    nullable: true,
  })
  @ApiProperty()
  deadWeightTonnage: string;

  @Column({
    nullable: true,
  })
  @ApiProperty()
  lengthOverAll: string;

  @Column({
    nullable: true,
  })
  @ApiProperty()
  propellerType: string;

  @Column({
    nullable: true,
  })
  @ApiProperty()
  mainEngine: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  @ApiProperty()
  auxEngine: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  @ApiProperty()
  auxEngine2: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  @ApiProperty()
  auxEngine3: string;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date;

  @ApiProperty()
  @ManyToOne(() => ShipType, (shiptype) => shiptype.id)
  shipType: ShipType;

  @OneToMany(() => Ship, (ship) => ship.id)
  damageReports: DamageReport[];

  @OneToMany(() => Ship, (ship) => ship.id)
  repairments: Repairment[];

  @OneToMany(() => Ship, (ship) => ship.id)
  goodServices: GoodServices[];

  @OneToMany(() => Ship, (ship) => ship.id)
  inventory: Inventory[];
}
