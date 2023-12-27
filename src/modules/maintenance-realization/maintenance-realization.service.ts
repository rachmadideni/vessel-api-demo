import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MaintenanceRealisation } from '../maintenance-plan/entities/maintenance-realisation.entity';
import { DataSource, Repository } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { MaintenanceRealisationItem } from '../maintenance-plan/entities/maintenance-realisation-item.entity';
import { CreateMaintenanceRealizationItemDto } from './dto/create-maintenance-realization-item.dto';
import { MaintenanceRealisationTask } from '../maintenance-plan/entities/maintenance-realisation-task.entity';
import { Approval } from '../approval/entities/approval.entity';
import { ApprovalService } from '../approval/approval.service';
import { CreateMaintenancePlanApproveDto } from '../maintenance-plan/dto/create-maintenance-plan-approve.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MaintenanceRealizationService {
  constructor(
    @InjectModel(MaintenanceRealisation)
    private maintenanceRealizationModel: Repository<MaintenanceRealisation>,
    @InjectModel(MaintenanceRealisationTask)
    private maintenanceRealisationTaskModel: Repository<MaintenanceRealisationTask>,
    @InjectModel(MaintenanceRealisationItem)
    private maintenanceRealisationItemModel: Repository<MaintenanceRealisationItem>,
    @InjectModel(Approval)
    private approvalModel: Repository<Approval>,
    @InjectModel(User)
    private userModel: Repository<User>,
    private approvalService: ApprovalService,
    private dataSource: DataSource
  ) {}
  async createItem(createMaintenanceRealizationItemDto: CreateMaintenanceRealizationItemDto): Promise<MaintenanceRealisationItem> {
    const [checkRealisation, checkTaskId] = await Promise.all([
      this.maintenanceRealizationModel.findOne({
        where: {
          id: createMaintenanceRealizationItemDto.maintenanceRealizationId,
        },
        select: {
          id: true,
          formNumber: true,
          statusPlan: true,
          statusRealisation: true,
        },
      }),
      this.maintenanceRealisationTaskModel.findOneBy({
        taskId: createMaintenanceRealizationItemDto.taskId,
      }),
    ]);

    if (!checkRealisation) throw new HttpException('Maintenance Plan ID not Found', HttpStatus.NOT_FOUND);
    if (!checkTaskId) throw new HttpException('Task ID not found', HttpStatus.NOT_FOUND);
    if (checkRealisation.statusPlan !== 'Approved') throw new HttpException('Maintenance Plan is not approved, cannot add implemented date', HttpStatus.BAD_REQUEST);
    if (checkRealisation.statusRealisation !== 'Pending')
      throw new HttpException(`Maintenance realization status ${checkRealisation.statusRealisation}, cannot add implemented date`, HttpStatus.BAD_REQUEST);

    const findExistingItem = await this.maintenanceRealisationItemModel.findOneBy({
      maintenanceRealisation: checkRealisation,
      taskId: createMaintenanceRealizationItemDto.taskId,
      implementedDate: createMaintenanceRealizationItemDto.implementedDate,
    });

    if (findExistingItem) {
      throw new HttpException('Realization date activity has existing', HttpStatus.CONFLICT);
    }

    const createdBy = await this.userModel.findOneBy({
      id: createMaintenanceRealizationItemDto.createdBy,
    });

    const maintenanceRealisationItem = new MaintenanceRealisationItem();
    maintenanceRealisationItem.maintenanceRealisation = checkRealisation;
    maintenanceRealisationItem.taskId = createMaintenanceRealizationItemDto.taskId;
    maintenanceRealisationItem.implementedDate = createMaintenanceRealizationItemDto.implementedDate;
    maintenanceRealisationItem.createdBy = createdBy;

    return this.maintenanceRealisationItemModel.save(maintenanceRealisationItem);
  }

  async createApproval(id: string) {
    const findRealisation = await this.maintenanceRealizationModel.findOne({
      where: {
        id,
        statusPlan: 'Approved',
      },
      select: {
        maintenanceForm: {
          id: true,
        },
      },
      relations: ['maintenanceForm'],
    });
    if (!findRealisation) throw new HttpException('Maintenance Realization ID not Found', HttpStatus.NOT_FOUND);
    if (!findRealisation.statusRealisation) throw new HttpException('Maintenance Realization has submitted approval', HttpStatus.CONFLICT);

    // const approvalReference = await this.approvalService.findingApproval(findRealisation.maintenanceForm.id);
    // const currentApprovalUser = await this.approvalModel.findOneBy({ user: approvalReference[0].user, approvalType: 'Maintenance Realization', maintenance: findRealisation });

    // if (currentApprovalUser)
    //   throw new HttpException(`User Approval ${approvalReference[0].user.firstName} ${approvalReference[0].user.lastName} already exist for Maintenance Realisation`, HttpStatus.CONFLICT);

    // const queryRunner = this.maintenanceRealizationModel.manager.connection.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    try {
      const approvalReference = await this.approvalService.findingApproval(findRealisation.maintenanceForm.id);

      // await queryRunner.manager.getRepository(Approval).save({
      //   user: approvalReference[0].user,
      //   maintenance: findRealisation,
      //   userFirstName: approvalReference[0].user.firstName,
      //   userLastName: approvalReference[0].user.lastName,
      //   userTitle: approvalReference[0].user.title,
      //   approvalType: 'Maintenance Realization',
      //   status: 'Pending',
      // });

      return await this.approvalModel.save({
        user: approvalReference[0].user,
        maintenance: findRealisation,
        userFirstName: approvalReference[0].user.firstName,
        userLastName: approvalReference[0].user.lastName,
        userTitle: approvalReference[0].user.title,
        approvalType: 'Maintenance Realization',
        status: 'Pending',
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      // await queryRunner.rollbackTransaction();
    }
    // finally {
    //   await queryRunner.release();
    // }
  }

  async findOne(id: string, userId = '') {
    const findOne = await this.dataSource
      .getRepository(MaintenanceRealisation)
      .createQueryBuilder('maintenanceRealisation')
      .leftJoinAndSelect('maintenanceRealisation.maintenancePlanTask', 'maintenancePlanTask')
      .leftJoinAndSelect('maintenanceRealisation.approval', 'approval', 'approval.status="Pending" AND approval.approvalType="Maintenance Realization"')
      .leftJoin('approval.user', 'user')
      .addSelect(['user.id', 'user.firstName', 'user.lastName', 'user.title'])
      .where('maintenanceRealisation.statusRealisation != :statusRealisation', { statusRealisation: 'null' })
      .andWhere('maintenanceRealisation.id = :id', { id })
      // .orderBy('maintenanceRealisation.createdAt', 'DESC')
      .orderBy('maintenancePlanTask.taskName', 'ASC')
      // .orderBy('approval.createdAt', 'ASC')
      .getOne();

    if (findOne) {
      const maintenancePlanTask = [];
      for (const findOneElement of findOne.maintenancePlanTask as any) {
        const findActivity = await this.dataSource
          .getRepository(MaintenanceRealisationItem)
          .createQueryBuilder('activity')
          .select('activity.implementedDate')
          .addSelect('activity.id')
          .where('activity.maintenanceRealisationId = :realisationId', {
            realisationId: findOne.id,
          })
          .andWhere('activity.taskId = :taskId', {
            taskId: findOneElement.taskId,
          })
          // .orderBy('activity.implementedDate', 'ASC')
          .orderBy('activity.planDate', 'ASC')
          .getMany();

        const itemDateActivity = [];
        const itemResultActivity = [];
        for (const activity of findActivity) {
          if (activity.implementedDate) {
            itemDateActivity.push({
              id: activity.id,
              date: findOne.maintenancePeriod === 'Harian' ? (activity.implementedDate ? new Date(activity.implementedDate).getDate() : 0) : new Date(activity.implementedDate).getMonth() + 1,
            });
          }
        }

        let maintenancePeriod = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        if (findOne.maintenancePeriod === 'Harian') {
          const getTotalDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
          const getYearFromMaintenanceRealisation = findOne.realisation.split('-')[0];
          const getMonthFromMaintenanceRealisation = findOne.realisation.split('-')[1];

          maintenancePeriod = [];
          for (let i = 1; i <= getTotalDaysInMonth(getMonthFromMaintenanceRealisation, getYearFromMaintenanceRealisation); i++) {
            maintenancePeriod.push(i);
          }
        }
        for (let i = 1; i <= maintenancePeriod.length; i++) {
          const element = itemDateActivity.find((element) => element.date == i);
          if (element) {
            itemResultActivity.push({
              id: element.id,
              date: i,
              status: true,
            });
          } else {
            itemResultActivity.push({
              id: null,
              date: i,
              status: false,
            });
          }
        }

        maintenancePlanTask.push({
          taskId: findOneElement.taskId,
          taskName: findOneElement.taskName,
          activity: itemResultActivity,
        });
      }
      if (findOne.approval?.user?.id) {
        findOne.approval.currentApprovalUser = findOne.approval.user.id === userId;
      }

      return {
        ...findOne,
        maintenancePlanTask,
      };
    }
    throw new NotFoundException('Not Found maintenance realization');
  }

  async removeItem(id: string) {
    const findRealisationItem = await this.maintenanceRealisationItemModel.findOne({
      relations: ['maintenanceRealisation'],
      where: {
        id,
      },
    });

    if (!findRealisationItem) throw new HttpException('Not found realization item activity ID', HttpStatus.NOT_FOUND);

    const findRealisation = await this.maintenanceRealizationModel.findOne({
      where: {
        id: findRealisationItem.maintenanceRealisation.id,
      },
    });

    if (findRealisation.statusRealisation !== 'Pending') throw new HttpException(`Cannot delete realization item activity ID, status ${findRealisation.statusRealisation}`, HttpStatus.BAD_REQUEST);

    await this.maintenanceRealisationItemModel.save({
      ...findRealisationItem,
      implementedDate: null,
    });
    throw new HttpException('Success update realization item activity ID', HttpStatus.OK);
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<MaintenanceRealisation>> {
    const findAll = await this.dataSource
      .getRepository(MaintenanceRealisation)
      .createQueryBuilder('maintenanceRealisation')
      .leftJoinAndSelect('maintenanceRealisation.approval', 'approval', 'approval.status="Pending" AND approval.approvalType="Maintenance Realization"')
      .leftJoin('approval.user', 'user')
      .addSelect(['user.id', 'user.firstName', 'user.lastName', 'user.title'])
      .where('maintenanceRealisation.statusRealisation != :statusRealisation', { statusRealisation: 'null' })
      .orderBy('maintenanceRealisation.createdAt', 'DESC')
      .orderBy('approval.createdAt', 'ASC');

    return paginate<MaintenanceRealisation>(findAll, options);
  }

  async approveMaintenance(createMaintenancePlanApproveDto: CreateMaintenancePlanApproveDto) {
    const user = new User();
    user.id = createMaintenancePlanApproveDto.idUser;

    const maintenanceRealization = new MaintenanceRealisation();
    maintenanceRealization.id = createMaintenancePlanApproveDto.idMaintenance;

    const findOne = await this.approvalModel.findOne({
      where: {
        id: createMaintenancePlanApproveDto.idApprove,
        user,
        maintenance: maintenanceRealization,
        approvalType: 'Maintenance Realization',
        status: 'pending',
      },
      relations: ['maintenance', 'maintenance.maintenanceForm'],
      select: {
        id: true,
        status: true,
        notes: true,
        approvalType: true,
        maintenance: {
          id: true,
          maintenanceForm: {
            id: true,
          },
        },
      },
    });

    if (!findOne) throw new HttpException('Not found approval', HttpStatus.NOT_FOUND);

    const findApprovalReference = await this.approvalService.findingApproval(findOne.maintenance.maintenanceForm.id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let lastApproval = false;
      for (const approval of findApprovalReference) {
        const user = new User();
        user.id = approval.user.id;

        const maintenanceRealization = new MaintenanceRealisation();
        maintenanceRealization.id = findOne.maintenance.id;

        const findApproval = await this.approvalModel.findOne({
          where: {
            user: user,
            maintenance: maintenanceRealization,
            approvalType: 'Maintenance Realization',
          },
        });

        if (!findApproval) {
          await queryRunner.manager.getRepository(Approval).save({
            user: user,
            userFirstName: approval.user.firstName,
            userLastName: approval.user.lastName,
            userTitle: approval.user.title,
            maintenance: maintenanceRealization,
            approvalType: 'Maintenance Realization',
            status: 'pending',
          });
          lastApproval = false;
          break;
        } else {
          lastApproval = true;
        }
      }

      if (lastApproval) {
        await queryRunner.manager.getRepository(MaintenanceRealisation).save({
          id: findOne.maintenance.id,
          statusRealisation: 'Approved',
        });
      }

      const insert = await queryRunner.manager.getRepository(Approval).save({
        ...findOne,
        status: 'Approved',
        notes: createMaintenancePlanApproveDto.approvalNotes,
      });

      await queryRunner.commitTransaction();
      return insert;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    } finally {
      await queryRunner.release();
    }
  }

  async rejectMaintenance(createMaintenancePlanApproveDto: CreateMaintenancePlanApproveDto) {
    const user = new User();
    user.id = createMaintenancePlanApproveDto.idUser;

    const maintenanceRealization = new MaintenanceRealisation();
    maintenanceRealization.id = createMaintenancePlanApproveDto.idMaintenance;

    const findOne = await this.approvalModel.findOne({
      where: {
        id: createMaintenancePlanApproveDto.idApprove,
        user,
        maintenance: maintenanceRealization,
        approvalType: 'Maintenance Realization',
        status: 'pending',
      },
      relations: ['maintenance', 'maintenance.maintenanceForm'],
      select: {
        id: true,
        status: true,
        notes: true,
        approvalType: true,
        maintenance: {
          id: true,
          maintenanceForm: {
            id: true,
          },
        },
      },
    });

    if (!findOne) throw new HttpException('Not found approval', HttpStatus.NOT_FOUND);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.getRepository(MaintenanceRealisation).save({
        id: findOne.maintenance.id,
        statusRealisation: 'Rejected',
      });

      const insert = await queryRunner.manager.getRepository(Approval).save({
        ...findOne,
        status: 'Rejected',
        notes: createMaintenancePlanApproveDto.approvalNotes,
      });

      await queryRunner.commitTransaction();
      return insert;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    } finally {
      await queryRunner.release();
    }
  }
}
