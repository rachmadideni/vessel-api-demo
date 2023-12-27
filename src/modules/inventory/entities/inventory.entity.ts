import { DamageReport } from 'src/modules/damage-reporting/entities/damage-report.entity';
import { Ship } from 'src/modules/ship/entities/ship.entity';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'inventory',
})
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ship, (ship) => ship.inventory)
  vessel: Ship;

  @ManyToOne(() => DamageReport, (dmr) => dmr.inventory)
  referenceNumber: DamageReport;
}
