import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';
import { InjectModel } from '@nestjs/sequelize';
import { MaintenanceRealisation } from './entities/maintenance-realisation.entity';
import { DataSource, In, Not, Repository } from 'typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { MaintenanceRealisationTask } from './entities/maintenance-realisation-task.entity';
import { MaintenanceRealisationItem } from './entities/maintenance-realisation-item.entity';
import { CreateMaintenancePlanItemDto } from './dto/create-maintenance-plan-item.dto';
import { UpdateMaintenancePlanDto } from './dto/update-maintenance-plan.dto';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import * as Sentry from '@sentry/node';
import * as path from 'path';
import hbs from 'handlebars';
import { readFileSync } from 'fs';
import { Task } from '../task/entities/task.entity';
import { Job } from '../job/entities/job.entity';
import { MaintenanceFormService } from '../maintenance-form/maintenance-form.service';
import { Ship } from '../ship/entities/ship.entity';
import { Approval } from '../approval/entities/approval.entity';
import { ApprovalService } from '../approval/approval.service';
import { CreateMaintenancePlanApproveDto } from './dto/create-maintenance-plan-approve.dto';
import { MaintenanceReportsDto } from './dto/maintenance-reports.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MaintenancePlanService {
  constructor(
    @InjectModel(MaintenanceRealisation)
    private maintenanceRealisationModel: Repository<MaintenanceRealisation>,
    @InjectModel(MaintenanceRealisationTask)
    private maintenanceRealisationTaskModel: Repository<MaintenanceRealisationTask>,
    @InjectModel(MaintenanceRealisationItem)
    private maintenanceRealisationItemModel: Repository<MaintenanceRealisationItem>,
    @InjectModel(Approval)
    private approvalModel: Repository<Approval>,
    @InjectModel(Task)
    private taskModel: Repository<Task>,
    private maintenanceFormService: MaintenanceFormService,
    private approvalService: ApprovalService,
    private dataSource: DataSource
  ) {}

  async create(createMaintenancePlanDto: CreateMaintenancePlanDto) {
    const checkFormNumber = await this.maintenanceRealisationModel.findOneBy({
      formNumber: createMaintenancePlanDto.formNumber,
      statusPlan: Not('Rejected'),
    });
    if (checkFormNumber) throw new HttpException({ message: 'Form number is exist', id: checkFormNumber.id, statusCode: HttpStatus.CONFLICT }, HttpStatus.CONFLICT);

    const findMaintenaceForm = await this.maintenanceFormService.findOne(createMaintenancePlanDto.maintenanceFormId);

    const maintenanceRealisation = new MaintenanceRealisation();
    maintenanceRealisation.formNumber = createMaintenancePlanDto.formNumber;
    maintenanceRealisation.realisation = createMaintenancePlanDto.realisationPeriod;
    maintenanceRealisation.statusPlan = 'Pending';
    maintenanceRealisation.jobName = findMaintenaceForm?.job?.name;
    maintenanceRealisation.formDate = findMaintenaceForm.formDate.toString();
    maintenanceRealisation.documentNumber = findMaintenaceForm.documentNumber;
    maintenanceRealisation.revisionNumber = findMaintenaceForm.revisionNumber;
    maintenanceRealisation.maintenancePeriod = findMaintenaceForm.maintenancePeriod;
    maintenanceRealisation.shipName = findMaintenaceForm?.ship?.name;
    maintenanceRealisation.maintenanceForm = findMaintenaceForm;

    const ship = new Ship();
    ship.id = findMaintenaceForm?.ship?.id;
    ship.name = findMaintenaceForm?.ship?.name;
    maintenanceRealisation.ship = ship;

    const job = new Job();
    job.id = findMaintenaceForm?.job?.id;
    job.name = findMaintenaceForm?.job?.name;
    maintenanceRealisation.job = job;

    const queryRunner = this.maintenanceRealisationModel.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const dataRealisation = await queryRunner.manager.getRepository(MaintenanceRealisation).save(maintenanceRealisation);

      for (const item of findMaintenaceForm.job.task as any) {
        const task = new Task();
        task.id = item.id;

        await queryRunner.manager.getRepository(MaintenanceRealisationTask).save({
          maintenanceRealisation: dataRealisation,
          taskId: task.id,
          taskName: item.name,
        });
      }

      for (const item of createMaintenancePlanDto.plan) {
        const [findExistingMaintenanceRealisationItem, findTaskId] = await Promise.all([
          this.maintenanceRealisationItemModel.findOneBy({
            maintenanceRealisation: dataRealisation,
            taskId: item.idTask,
            planDate: item.planDate,
          }),
          this.taskModel.findOneBy({
            id: item.idTask,
          }),
        ]);

        if (!findTaskId) throw new NotFoundException('Task id not found');

        if (!findExistingMaintenanceRealisationItem) {
          await queryRunner.manager.getRepository(MaintenanceRealisationItem).save({
            maintenanceRealisation: dataRealisation,
            taskId: item.idTask,
            planDate: item.planDate,
          });
        } else {
          throw new HttpException(`Maintenance Plan with date ${item.planDate} already exist`, HttpStatus.CONFLICT);
        }
      }
      delete dataRealisation.job.task;
      delete dataRealisation.maintenanceForm;

      const approvalReference = await this.approvalService.findingApproval(findMaintenaceForm.id);
      await queryRunner.manager.getRepository(Approval).save({
        user: approvalReference[0].user,
        maintenance: dataRealisation,
        userFirstName: approvalReference[0].user.firstName,
        userLastName: approvalReference[0].user.lastName,
        userTitle: approvalReference[0].user.title,
        approvalType: 'Maintenance Plan',
        status: 'Pending',
      });
      await queryRunner.commitTransaction();

      return {
        ...dataRealisation,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(e.message, e.status || 500);
    } finally {
      await queryRunner.release();
    }
  }

  async createItem(createMaintenancePlanItemDto: CreateMaintenancePlanItemDto): Promise<MaintenanceRealisationItem> {
    const [checkRealisation, checkTaskId] = await Promise.all([
      this.maintenanceRealisationModel.findOne({
        where: {
          id: createMaintenancePlanItemDto.maintenancePlanId,
        },
        select: {
          id: true,
          formNumber: true,
          statusPlan: true,
        },
      }),
      this.maintenanceRealisationTaskModel.findOneBy({
        taskId: createMaintenancePlanItemDto.taskId,
      }),
    ]);

    if (!checkRealisation) {
      throw new HttpException('Maintenance Plan ID not Found', HttpStatus.NOT_FOUND);
    }
    if (checkRealisation.statusPlan !== 'Pending') throw new HttpException(`Cannot add plan date, Maintenance plan status ${checkRealisation.statusPlan}`, HttpStatus.BAD_REQUEST);

    if (!checkTaskId) {
      throw new HttpException('Task ID not found', HttpStatus.NOT_FOUND);
    }

    const findExistingItem = await this.maintenanceRealisationItemModel.findOneBy({
      maintenanceRealisation: checkRealisation,
      taskId: createMaintenancePlanItemDto.taskId,
      planDate: createMaintenancePlanItemDto.planDate,
    });

    if (findExistingItem) {
      throw new HttpException('Plan date has existing', HttpStatus.CONFLICT);
    }

    const maintenanceRealisationItem = new MaintenanceRealisationItem();
    maintenanceRealisationItem.maintenanceRealisation = checkRealisation;
    maintenanceRealisationItem.taskId = createMaintenancePlanItemDto.taskId;
    maintenanceRealisationItem.planDate = createMaintenancePlanItemDto.planDate;

    return this.maintenanceRealisationItemModel.save(maintenanceRealisationItem);
  }

  async findOne(id: string, userId = '') {
    const findOne = await this.maintenanceRealisationModel.findOne({
      where: {
        id,
        approval: {
          status: In(['Pending', 'Rejected']),
          approvalType: 'Maintenance Plan',
        },
      },
      select: {
        approval: {
          id: true,
          status: true,
          approvalType: true,
          userFirstName: true,
          userLastName: true,
          userTitle: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
      order: {
        maintenancePlanTask: {
          taskName: 'ASC',
        },
      },
      relations: ['maintenancePlanTask', 'approval', 'approval.user'],
    });
    if (findOne) {
      const maintenancePlanTask = [];
      for (const findOneElement of findOne.maintenancePlanTask as any) {
        const findActivity = await this.dataSource
          .getRepository(MaintenanceRealisationItem)
          .createQueryBuilder('activity')
          .select('activity.planDate')
          .addSelect('activity.id')
          .where('activity.maintenanceRealisationId = :realisationId', {
            realisationId: findOne.id,
          })
          .andWhere('activity.taskId = :taskId', {
            taskId: findOneElement.taskId,
          })
          .orderBy('activity.planDate', 'ASC')
          .getMany();

        const itemDateActivity = [];
        const itemResultActivity = [];
        for (const activity of findActivity) {
          itemDateActivity.push({
            id: activity.id,
            date: findOne.maintenancePeriod === 'Harian' ? (activity.planDate ? new Date(activity.planDate).getDate() : 0) : new Date(activity.planDate).getMonth() + 1,
          });
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

      findOne.approval.currentApprovalUser = findOne.approval?.user?.id === userId;

      return {
        ...findOne,
        maintenancePlanTask,
      };
    }
    throw new NotFoundException('Not Found maintenance plan');
  }

  async update(id: string, updateMaintenanceRealisationDto: UpdateMaintenancePlanDto) {
    const findId = await this.maintenanceRealisationModel.findOneBy({
      id,
    });
    if (!findId) throw new HttpException('Maintenance realization ID not found', HttpStatus.NOT_FOUND);
    if (findId.statusPlan !== 'Pending') throw new HttpException(`Maintenance realization cannot update, status approve ${findId.statusPlan}`, HttpStatus.BAD_REQUEST);

    const checkFormNumber = await this.maintenanceRealisationModel.findOne({
      where: {
        formNumber: updateMaintenanceRealisationDto.formNumber,
        id: Not(id),
      },
    });
    if (checkFormNumber) throw new HttpException('Form number is exist', HttpStatus.CONFLICT);

    return this.maintenanceRealisationModel.save({
      ...findId,
      formNumber: updateMaintenanceRealisationDto.formNumber,
    });
  }

  async removeItem(id: string) {
    const findRealisationItem = await this.maintenanceRealisationItemModel.findOne({
      relations: ['maintenanceRealisation'],
      where: {
        id,
      },
    });
    const findRealisation = await this.maintenanceRealisationModel.findOne({
      where: {
        id: findRealisationItem.maintenanceRealisation.id,
      },
    });
    if (!findRealisationItem) throw new HttpException('Not found realization item activity ID', HttpStatus.NOT_FOUND);
    if (findRealisation.statusPlan !== 'Pending') throw new HttpException(`Cannot delete realization item activity ID, status ${findRealisation.statusPlan}`, HttpStatus.BAD_REQUEST);

    await this.maintenanceRealisationItemModel.delete(id);
    throw new HttpException('Success update realization item activity ID', HttpStatus.OK);
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<MaintenanceRealisation>> {
    const findAll = await this.dataSource
      .getRepository(MaintenanceRealisation)
      .createQueryBuilder('maintenanceRealisation')
      .leftJoinAndSelect('maintenanceRealisation.approval', 'approval', 'approval.status="Pending" AND approval.approvalType="Maintenance Plan"')
      .leftJoin('approval.user', 'user')
      .addSelect(['user.id', 'user.firstName', 'user.lastName', 'user.title'])
      .where('maintenanceRealisation.statusPlan != :statusPlan', { statusPlan: 'Approved' })
      .orderBy('maintenanceRealisation.createdAt', 'DESC')
      .orderBy('approval.createdAt', 'ASC');

    return paginate<MaintenanceRealisation>(findAll, options);
  }

  async generatePDF(id: string): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      const maintenanceRealisation = await this.findOne(id);
      let countDates = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      if (maintenanceRealisation.maintenancePeriod === 'Harian') {
        const getTotalDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
        const getYearFromMaintenanceRealisation = maintenanceRealisation.realisation.split('-')[0];
        const getMonthFromMaintenanceRealisation = maintenanceRealisation.realisation.split('-')[1];

        countDates = [];
        for (let i = 1; i <= getTotalDaysInMonth(getMonthFromMaintenanceRealisation, getYearFromMaintenanceRealisation); i++) {
          countDates.push(String(i));
        }
      }

      const convertMonthToName = (monthInt) => {
        const monthName = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return monthName[monthInt - 1];
      };

      maintenanceRealisation.realisation = `${convertMonthToName(new Date(maintenanceRealisation.realisation).getMonth() + 1)} ${new Date(maintenanceRealisation.realisation).getFullYear()}`;
      maintenanceRealisation.formDate = `${new Date(maintenanceRealisation.formDate).getDate()} ${convertMonthToName(new Date(maintenanceRealisation.formDate).getMonth() + 1)} ${new Date(
        maintenanceRealisation.formDate
      ).getFullYear()}`;

      const content = await this.templatePdf('report_maintenance', {
        imageSrc: `data:image/png;base64,${readFileSync('assets/images/logo.png').toString('base64')}`,
        maintenanceRealisation,
        countDates,
        currentDate: `${new Date().getDate()} ${convertMonthToName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`,
      });
      // set up the page content
      await page.setContent(content);

      // generate the PDF
      const pdfBuffer = await page.pdf({
        format: 'LEGAL',
        landscape: true,
        printBackground: true,
        margin: { top: '1cm', right: '0', bottom: '1cm', left: '0' },
        displayHeaderFooter: true,
        headerTemplate: '<div/>',
        footerTemplate: `<div style="text-align: left;width: 197mm;font-size: 8px;margin-left: 100rem">Putih : DPA </div><div style="text-align: left;width: 297mm;font-size: 8px;">Kuning : Nahkoda </div><div style="text-align: right;width: 297mm;font-size: 8px;">Page <span style="margin-right: 1cm"><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      });

      // close the browser
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      // throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      // Sentry.captureException(error);
    }
  }

  async templatePdf(templateName, data) {
    const filePath = path.join(process.cwd(), 'assets', `template/${templateName}.hbs`);

    const html = await fs.readFile(filePath, 'utf8');

    hbs.registerHelper('eq', function (a, b) {
      return a === b;
    });

    hbs.registerHelper('times', function (n, block) {
      let accum = '';
      for (let i = 0; i < n; ++i) accum += block.fn(i + 1);
      return accum;
    });

    hbs.registerHelper('increment', function (value) {
      return ++value;
    });

    return hbs.compile(html)(data);
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
        approvalType: 'Maintenance Plan',
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
      let lastApproval = true;
      for (const approval of findApprovalReference) {
        const user = new User();
        user.id = approval.user.id;

        const maintenanceRealization = new MaintenanceRealisation();
        maintenanceRealization.id = findOne.maintenance.id;

        const findApproval = await this.approvalModel.findOne({
          where: {
            user: user,
            maintenance: maintenanceRealization,
            approvalType: 'Maintenance Plan',
          },
        });

        if (!findApproval) {
          await queryRunner.manager.getRepository(Approval).save({
            user: user,
            userFirstName: approval.user.firstName,
            userLastName: approval.user.lastName,
            userTitle: approval.user.title,
            maintenance: maintenanceRealization,
            approvalType: 'Maintenance Plan',
            status: 'pending',
          });
          lastApproval = false;
          break;
        }
      }

      if (lastApproval) {
        await queryRunner.manager.getRepository(MaintenanceRealisation).save({
          id: findOne.maintenance.id,
          statusPlan: 'Approved',
          statusRealisation: 'Pending',
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
        approvalType: 'Maintenance Plan',
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
        statusPlan: 'Rejected',
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

  // maintenance reports
  async maintenanceReports(options: IPaginationOptions, request: MaintenanceReportsDto): Promise<Pagination<MaintenanceRealisation>> {
    const { vesselId, maintenancePeriod, formDate } = request;
    const ship = await this.dataSource.getRepository(Ship).findOne({
      where: {
        id: vesselId,
      },
    });

    if (!ship) throw new HttpException('Ship not found', HttpStatus.NOT_FOUND);
    return paginate<MaintenanceRealisation>(this.maintenanceRealisationModel, options, {
      where: {
        ship: {
          id: vesselId,
        },
        maintenancePeriod,
        formDate,
      },
    });
  }
}
