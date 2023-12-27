import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { GoodServices } from 'src/modules/good-services/entities/good-services.entity';

@Entity({
  name: 'common_sections',
})
export class Sections {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => GoodServices, (gs) => gs.section)
  goodServices: GoodServices[];
}
