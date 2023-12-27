import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Ship } from '../ship/entities/ship.entity';
import { Job } from '../job/entities/job.entity';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { InjectModel } from '@nestjs/sequelize';
import { DataSource, Repository } from 'typeorm';
import { JobService } from '../job/job.service';
import { ShipService } from '../ship/ship.service';
import { MaintenanceForm } from './entities/maintenance-form.entity';
import { CreateMaintenanceFormDto } from './dto/create-maintenance-form.dto';
import { UpdateMaintenanceFormDto } from './dto/update-maintenance-form.dto';
import { User } from '../users/entities/user.entity';
import { ApprovalReference } from '../approval/entities/approval-reference.entity';

@Injectable()
export class MaintenanceFormService {
  constructor(
    @InjectModel(MaintenanceForm)
    private maintenanceFormModel: Repository<MaintenanceForm>,
    private dataSource: DataSource,
    private jobService: JobService,
    private shipService: ShipService
  ) {}

  async create(createMaintenanceFormDto: CreateMaintenanceFormDto) {
    const [findShip, findJob] = await Promise.all([this.shipService.findOne(createMaintenanceFormDto.shipId), this.jobService.findOne(createMaintenanceFormDto.jobId)]);

    const ship = new Ship();
    ship.id = findShip.id;
    ship.name = findShip.name;

    const job = new Job();
    job.id = findJob.id;
    job.name = findJob.name;

    const maintenanceForm = new MaintenanceForm();
    maintenanceForm.documentNumber = createMaintenanceFormDto.documentNumber;
    maintenanceForm.revisionNumber = createMaintenanceFormDto.revisionNumber;
    maintenanceForm.maintenancePeriod = createMaintenanceFormDto.maintenancePeriod;
    maintenanceForm.formDate = new Date(Date.now());
    maintenanceForm.ship = ship;
    maintenanceForm.job = job;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // check for duplicate approval user
      const approvals = createMaintenanceFormDto.approvalUser;
      const duplicates = approvals.filter((item, index) => approvals.indexOf(item) !== index);
      if (duplicates.length > 0) throw new HttpException('Duplicate approval user', HttpStatus.CONFLICT);

      const insert = await queryRunner.manager.getRepository(MaintenanceForm).save(maintenanceForm);
      for (const approval of createMaintenanceFormDto.approvalUser) {
        const maintenanceForm = new MaintenanceForm();
        maintenanceForm.id = insert.id;

        const user = new User();
        user.id = approval;

        const [findUser, findApprovalExist] = await Promise.all([
          queryRunner.manager.getRepository(User).findOneBy({ id: approval }),
          queryRunner.manager.getRepository(ApprovalReference).findOne({
            where: {
              user: user,
              maintenanceForm: maintenanceForm,
            },
          }),
        ]);

        if (!findUser) throw new HttpException('User id for approval not found', HttpStatus.NOT_FOUND);

        if (!findApprovalExist) {
          const approvalReference = new ApprovalReference();
          approvalReference.maintenanceForm = maintenanceForm;
          approvalReference.user = user;

          await queryRunner.manager.getRepository(ApprovalReference).save(approvalReference);
        }
      }

      await queryRunner.commitTransaction();
      return insert;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status || 500);
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return `This action returns all maintenancePlan`;
  }

  async findOne(id: string): Promise<MaintenanceForm> {
    const findOne = await this.maintenanceFormModel.findOne({
      where: {
        id,
      },
      select: {
        ship: {
          id: true,
          name: true,
        },
        job: {
          id: true,
          name: true,
        },
        approvalReferences: {
          id: true,
          createdAt: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
      order: {
        job: {
          task: {
            name: 'ASC',
          },
        },
        createdAt: 'ASC',
        approvalReferences: {
          createdAt: 'ASC',
        },
      },
      relations: ['ship', 'job', 'job.task', 'approvalReferences', 'approvalReferences.user'],
    });

    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Not found maintenance form');
  }

  async update(id: string, updateMaintenanceFormDto: UpdateMaintenanceFormDto) {
    const findOne = await this.maintenanceFormModel.findOneBy({ id });
    if (!findOne) throw new HttpException('Maintenance form not found', HttpStatus.NOT_FOUND);

    const maintenanceForm = new MaintenanceForm();
    maintenanceForm.documentNumber = updateMaintenanceFormDto.documentNumber;
    maintenanceForm.revisionNumber = updateMaintenanceFormDto.revisionNumber;
    maintenanceForm.maintenancePeriod = updateMaintenanceFormDto.maintenancePeriod;

    let checkShip = new Ship();
    if (updateMaintenanceFormDto.shipId) {
      checkShip = await this.shipService.findOne(updateMaintenanceFormDto.shipId);
      maintenanceForm.ship = checkShip;
    }

    let checkJob = new Job();
    if (updateMaintenanceFormDto.jobId) {
      checkJob = await this.jobService.findOne(updateMaintenanceFormDto.jobId);
      maintenanceForm.job = checkJob;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updateMaintenanceFormDto.approvalUser) {
        if (!this.checkDuplicate(updateMaintenanceFormDto.approvalUser)) throw new HttpException('Duplicate approval user', HttpStatus.CONFLICT);
        if (updateMaintenanceFormDto.approvalUser.length < 3) throw new HttpException('Approval user must be 3', HttpStatus.BAD_REQUEST);

        const maintenanceFormApproval = new MaintenanceForm();
        maintenanceFormApproval.id = id;
        const deleteApproval = await queryRunner.manager.getRepository(ApprovalReference).delete({
          maintenanceForm: maintenanceFormApproval,
        });

        for (const approval of updateMaintenanceFormDto.approvalUser) {
          const user = new User();
          user.id = approval;
          const [findUser] = await Promise.all([this.dataSource.manager.getRepository(User).findOneBy({ id: approval })]);

          if (!findUser) throw new HttpException('User id for approval not found', HttpStatus.NOT_FOUND);

          const approvalReference = new ApprovalReference();
          approvalReference.maintenanceForm = maintenanceFormApproval;
          approvalReference.user = user;
          await queryRunner.manager.getRepository(ApprovalReference).save(approvalReference);
        }
      }

      const update = await queryRunner.manager.getRepository(MaintenanceForm).save({
        ...findOne,
        ...maintenanceForm,
      });
      await queryRunner.commitTransaction();
      return update;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status || 500);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.maintenanceFormModel.softDelete(id);
  }

  async removeApproval(id: string) {
    const findApproval = await this.dataSource.getRepository(ApprovalReference).findOneBy({
      id,
    });
    if (!findApproval) {
      throw new HttpException('Not found approval reference', HttpStatus.NOT_FOUND);
    }

    return this.dataSource.getRepository(ApprovalReference).softDelete(findApproval.id);
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<MaintenanceForm>> {
    const findAll = await this.dataSource
      .getRepository(MaintenanceForm)
      .createQueryBuilder('maintenanceForm')
      .select(['maintenanceForm', 'ship.id', 'ship.name', 'job.id', 'job.name'])
      .leftJoin('maintenanceForm.ship', 'ship')
      .leftJoin('maintenanceForm.job', 'job')
      .orderBy('maintenanceForm.createdAt', 'DESC');

    return paginate<MaintenanceForm>(findAll, options);
  }

  checkDuplicate(approvalUser: string[]): boolean {
    const uniqueUserSet = new Set(approvalUser);
    return uniqueUserSet.size === approvalUser.length;
  }
}
