import { Repository } from 'typeorm';
import { DamageReport } from '../entities/damage-report.entity';

export interface DamageRepository extends Repository<DamageReport> {
  this: Repository<DamageReport>;
  filterByShipId(shipId: string): Promise<DamageReport[]>;
}

export const damageReportCustomRepository: Pick<DamageRepository, any> = {
  filterByShipId(this: Repository<DamageReport>, shipId: string) {
    return this.findOne({
      where: {
        ship: {
          id: shipId,
        },
      },
    });
  },
};
