import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MaintenanceRealisation } from './maintenance-realisation.entity';

@Entity({
  name: 'maintenance_realisation_task',
})
export class MaintenanceRealisationTask {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Column()
  taskName: string;

  @Column()
  taskId: string;

  @ManyToOne(() => MaintenanceRealisation, (maintenanceRealisation) => maintenanceRealisation.id)
  maintenanceRealisation: MaintenanceRealisation;
}
