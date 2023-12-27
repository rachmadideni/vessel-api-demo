import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Approval } from './entities/approval.entity';
import { DataSource, Repository } from 'typeorm';
import { MaintenanceRealisation } from '../maintenance-plan/entities/maintenance-realisation.entity';
import { User } from '../users/entities/user.entity';
import { ApprovalReference } from './entities/approval-reference.entity';
import { MaintenanceForm } from '../maintenance-form/entities/maintenance-form.entity';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectModel(Approval)
    private approvalModel: Repository<Approval>,
    private datasource: DataSource
  ) {}

  async approve(createApprovalDto: CreateApprovalDto) {
    const maintenancePlan = new MaintenanceRealisation();
    maintenancePlan.id = createApprovalDto.id;
    const user = new User();
    user.id = createApprovalDto.userId;

    const [findApproval, findMaintenanceId] = await Promise.all([
      this.approvalModel.findOneBy({ id: createApprovalDto.id, user: user, status: 'pending' }),
      this.approvalModel.findOneBy({ maintenance: maintenancePlan }),
    ]);

    if (!findMaintenanceId) throw new NotFoundException('Maintenance Id Not Found');
    if (!findApproval) throw new NotFoundException('Approval Not Found');

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const query = this.approvalModel.save({
        ...findApproval,
        status: 'approved',
      });

      await queryRunner.commitTransaction();
      return query;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status || 500);
    } finally {
      await queryRunner.release();
    }
  }

  async findingApproval(maintenanceIdForm: string): Promise<ApprovalReference[]> {
    const maintenanceForm = new MaintenanceForm();
    maintenanceForm.id = maintenanceIdForm;

    const findAllApproval = await this.datasource.getRepository(ApprovalReference).find({
      where: {
        maintenanceForm: maintenanceForm,
      },
      order: {
        createdAt: 'ASC',
      },
      relations: ['user'],
      select: {
        id: true,
        user: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
        }
      },
    })

    if (!findAllApproval) {
      throw new NotFoundException('Approval reference Not Found');
    }

    return findAllApproval;
  }
}
