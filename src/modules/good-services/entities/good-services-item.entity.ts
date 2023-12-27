import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { GoodServices } from './good-services.entity';
import { Part } from 'src/modules/part/entities/part.entity';
@Entity({
  name: 'good_services_item',
})
export class GoodServicesItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // part Id

  // @OneToOne(() => Part)
  // @JoinColumn()
  // part: Part;

  @ManyToOne(() => Part, (part) => part.id, {
    eager: true,
  })
  @JoinColumn()
  part: Part;
  // part: string;

  @ManyToOne(() => GoodServices, (goodServices) => goodServices.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'goodServicesId',
    referencedColumnName: 'id',
  })
  goodServices: GoodServices;

  @Column()
  usagePlanDate: Date;

  // estimasi harga part per unit
  @Column()
  estimatedPartPrice: number;

  // sisa
  // @Column()
  // currentQuantity: number;

  // minta
  @Column()
  orderedQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TON, PCS, DLL
  // @Column({
  //   length: 30,
  // })
  // partUnit: string;
}
