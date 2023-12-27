import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { MaintenanceRealisation } from './maintenance-realisation.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity({
  name: 'maintenance_realisation_item',
})
export class MaintenanceRealisationItem {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  implementedDate: Date;

  @Column({
    type: 'date',
    nullable: true,
  })
  planDate: Date;

  @Column()
  taskId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => MaintenanceRealisation, (maintenanceRealisation) => maintenanceRealisation.id)
  maintenanceRealisation: MaintenanceRealisation;

  @ManyToOne(() => User, (user) => user.id, {
    eager: true,
  })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;
}
