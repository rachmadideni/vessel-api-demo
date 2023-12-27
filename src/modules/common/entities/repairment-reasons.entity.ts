import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'common_repairment_reasons',
})
export class CommonRepairmentReasons {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
