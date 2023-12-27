import { Injectable, HttpException, HttpStatus, NotFoundException, StreamableFile } from '@nestjs/common';
import { DataSource, Repository, In, Not, IsNull } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { MaintenanceReportsDto } from './dto/maintenance-reports.dto';
import { MaintenanceRealisation } from '../maintenance-plan/entities/maintenance-realisation.entity';
import { MaintenanceRealisationItem } from '../maintenance-plan/entities/maintenance-realisation-item.entity';
import { User } from '../users/entities/user.entity';
import { Approval } from '../approval/entities/approval.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/sequelize';

import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import * as Sentry from '@sentry/node';
import * as path from 'path';
import hbs from 'handlebars';
import { readFileSync } from 'fs';
import compileHbs from 'src/common/utils/pdf';

@Injectable()
export class MaintenanceReportService {
  constructor(
    @InjectModel(MaintenanceRealisation)
    private maintenanceRealisationModel: Repository<MaintenanceRealisation>,
    private dataSource: DataSource,
    @InjectRepository(Approval) private readonly approvalRepository: Repository<Approval>,
    @InjectRepository(MaintenanceRealisation) private readonly maintenanceRealisationRepository: Repository<MaintenanceRealisation>,
    @InjectRepository(MaintenanceRealisationItem) private readonly maintenanceRealisationItemRepository: Repository<MaintenanceRealisationItem>,
    @InjectRepository(User) private readonly userRepo: Repository<User>
  ) {}

  //   async paginate(options: IPaginationOptions): Promise<Pagination<MaintenanceRealisation>> {
  //     const MaintenanceRealisation = await this.maintenanceRealisationRepository.createQueryBuilder('maintenance_realisation');
  //   }

  async maintenanceReports(options: IPaginationOptions, request: MaintenanceReportsDto): Promise<Pagination<MaintenanceRealisation>> {
    const { vesselId, maintenancePeriod, formDate } = request;
    return paginate<MaintenanceRealisation>(this.maintenanceRealisationRepository, options, {
      where: {
        statusRealisation: 'Approved',
        approval: {
          approvalType: 'Maintenance Realization',
        },
        ...(vesselId && { ship: { id: vesselId } }),
        ...(maintenancePeriod && { maintenancePeriod }),
        ...(formDate && { formDate }),
      },
    });

    // https://stackoverflow.com/questions/72465018/nestjs-typeorm-how-to-filter-with-optional-parameters-i-have-one-version
    // backup
    /*
    where: {
        statusRealisation: 'Approved',
        ship: {
          id: vesselId,
        },
        maintenancePeriod,
        formDate,
      },
    */
  }

  async findOne(id: string, userId = '') {
    const findOne = await this.maintenanceRealisationModel.findOne({
      where: {
        id,
        statusRealisation: 'Approved',
        approval: {
          status: In(['Approved']),
          approvalType: 'Maintenance Realization',
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
          .select('activity.implementedDate')
          .addSelect('activity.id')
          .addSelect('activity.createdBy')
          .where('activity.maintenanceRealisationId = :realisationId', {
            realisationId: findOne.id,
          })
          .andWhere('activity.taskId = :taskId', {
            taskId: findOneElement.taskId,
          })
          .andWhere('activity.implementedDate IS NOT NULL')
          .orderBy('activity.implementedDate', 'ASC')
          .getMany();

        const itemDateActivity = [];
        const itemResultActivity = [];
        for (const activity of findActivity) {
          itemDateActivity.push({
            id: activity.id,
            date: findOne.maintenancePeriod === 'Harian' ? (activity.implementedDate ? new Date(activity.implementedDate).getDate() : 0) : new Date(activity.implementedDate).getMonth() + 1,
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

      return {
        ...findOne,
        maintenancePlanTask,
      };
    }
  }

  // generate PDF
  async generatePDF(id: string) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      const maintenanceRealisation = await this.findOne(id);

      const approvals = await this.approvalRepository.find({
        where: {
          approvalType: 'Maintenance Realization',
          maintenance: {
            id,
          },
        },
        relations: ['user', 'user.roles'],
        select: {
          user: {
            id: true,
            roles: {
              name: true,
            },
          },
        },
        order: {
          createdAt: 'ASC',
        },
      });

      const createdBy = await this.maintenanceRealisationItemRepository.find({
        where: {
          maintenanceRealisation: {
            id,
          },
        },
        select: {
          createdBy: {
            id: true,
          },
        },
      });

      const recordWithCreatedByNotNull = createdBy.find((item) => item.createdBy !== null);
      const userCreationId = recordWithCreatedByNotNull.createdBy.id;

      const userCreated = await this.userRepo.findOne({
        where: {
          id: userCreationId,
        },
        relations: {
          roles: true,
        },
      });

      const userCreatedRoleName = userCreated?.roles[0]?.name;

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

      const FlattenedApprovals = approvals.map((approval) => ({
        id: approval.id,
        status: approval.status,
        notes: approval.notes,
        userFirstName: approval.userFirstName,
        userLastName: approval.userLastName,
        userTitle: approval.userTitle,
        approvalType: approval.approvalType,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt,
        role: approval.user.roles[0].name,
      }));

      const content = await compileHbs('report_maintenance', {
        imageSrc: `data:image/png;base64,${readFileSync('assets/images/logo.png').toString('base64')}`,
        maintenanceRealisation,
        countDates,
        createdBy: userCreatedRoleName,
        approvals: FlattenedApprovals,
        currentDate: `${new Date().getDate()} ${convertMonthToName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`,
      });

      await page.setContent(content);
      const pdfBuffer = await page.pdf({
        format: 'LEGAL',
        landscape: true,
        printBackground: true,
        margin: { top: '1cm', right: '0', bottom: '100px', left: '0' },
        displayHeaderFooter: true,
        headerTemplate: '<div/>',
        footerTemplate: `<div style="text-align: left;width: 197mm;font-size: 8px;margin-left: 100rem">Putih : DPA </div><div style="text-align: left;width: 297mm;font-size: 8px;">Kuning : Nahkoda </div><div style="text-align: right;width: 297mm;font-size: 8px;">Page <span style="margin-right: 1cm"><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      });

      await browser.close();
      return pdfBuffer;
    } catch (err) {
      console.log('err', err);
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findPlanRealisasi(id: string) {
    const findOne = await this.maintenanceRealisationModel.findOne({
      where: {
        id,
        statusRealisation: 'Approved',
        approval: {
          status: In(['Approved']),
          approvalType: 'Maintenance Realization',
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
      // start
      for (const findOneElement of findOne.maintenancePlanTask as any) {
        const activitiesQuery = this.dataSource
          .getRepository(MaintenanceRealisationItem)
          .createQueryBuilder('activity')
          .select('activity.implementedDate')
          .addSelect('activity.planDate')
          .addSelect('activity.id')
          .addSelect('activity.createdBy')
          .where('activity.maintenanceRealisationId = :realisationId', {
            realisationId: findOne.id,
          })
          .andWhere('activity.taskId = :taskId', {
            taskId: findOneElement.taskId,
          });

        if (findOne.maintenancePeriod === 'Harian') {
          activitiesQuery.addOrderBy('activity.planDate', 'ASC');
          activitiesQuery.addOrderBy('activity.implementedDate', 'ASC');
        } else {
          activitiesQuery.addOrderBy('MONTH(activity.planDate)', 'ASC');
          activitiesQuery.addOrderBy('MONTH(activity.implementedDate)', 'ASC');
        }

        const findActivity = await activitiesQuery.getMany();

        const itemDateActivity = [];
        const itemResultActivity = [];
        for (const activity of findActivity) {
          itemDateActivity.push({
            id: activity.id,
            type: activity.implementedDate ? 'realisasi' : 'plan',
            planDate:
              findOne.maintenancePeriod === 'Harian' && activity.planDate !== null
                ? activity.planDate
                  ? new Date(activity.planDate).getDate()
                  : 0
                : activity.planDate !== null
                ? new Date(activity.planDate).getMonth() + 1
                : null,
            realisationDate:
              findOne.maintenancePeriod === 'Harian' && activity.implementedDate !== null
                ? activity.implementedDate
                  ? new Date(activity.implementedDate).getDate()
                  : 0
                : activity.implementedDate !== null
                ? new Date(activity.implementedDate).getMonth() + 1
                : null,
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

        const elemPlanResult = [];
        const elemRealResult = [];

        for (let i = 1; i <= maintenancePeriod.length; i++) {
          let elemPlan = null,
            elemReal = null;

          elemPlan = itemDateActivity.find((elem) => elem.planDate === i);
          elemReal = itemDateActivity.find((elem) => elem.realisationDate === i);

          if (elemPlan) {
            elemPlanResult.push(elemPlan);
          }
          if (elemReal) {
            elemRealResult.push(elemReal);
          }

          itemResultActivity.push({
            id: elemPlan?.id ? elemPlan?.id : null,
            date: i,
            planDate: elemPlan?.planDate === i ? elemPlan?.planDate : null,
            realizationDate: elemReal?.realisationDate ? elemReal?.realisationDate : null,
            isPlanned: elemPlan?.planDate ? true : false,
            isRealized: elemReal?.realisationDate ? true : false,
          });
        }

        maintenancePlanTask.push({
          taskId: findOneElement.taskId,
          taskName: findOneElement.taskName,
          activity: itemResultActivity,
        });
      }
      // end
      return {
        ...findOne,
        maintenancePlanTask,
      };
    }

    return findOne;
  }

  planRealisasi(id: string) {
    const maintenanceRealisation = this.findPlanRealisasi(id);
    return maintenanceRealisation;
  }

  async generatePlanRealisationPDF(id: string) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      const maintenanceRealisation = await this.findPlanRealisasi(id);

      const approvals = await this.approvalRepository.find({
        where: {
          approvalType: 'Maintenance Realization',
          maintenance: {
            id,
          },
        },
        relations: ['user', 'user.roles'],
        select: {
          user: {
            id: true,
            roles: {
              name: true,
            },
          },
        },
        order: {
          createdAt: 'ASC',
        },
      });

      const createdBy = await this.maintenanceRealisationItemRepository.find({
        where: {
          maintenanceRealisation: {
            id,
          },
        },
        select: {
          createdBy: {
            id: true,
          },
        },
      });

      const recordWithCreatedByNotNull = createdBy.find((item) => item.createdBy !== null);
      const userCreationId = recordWithCreatedByNotNull.createdBy.id;

      const userCreated = await this.userRepo.findOne({
        where: {
          id: userCreationId,
        },
        relations: {
          roles: true,
        },
      });

      const userCreatedRoleName = userCreated?.roles[0]?.name;

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

      const FlattenedApprovals = approvals.map((approval) => ({
        id: approval.id,
        status: approval.status,
        notes: approval.notes,
        userFirstName: approval.userFirstName,
        userLastName: approval.userLastName,
        userTitle: approval.userTitle,
        approvalType: approval.approvalType,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt,
        role: approval.user.roles[0].name,
      }));

      const content = await compileHbs('report_maintenance_plan_realisation', {
        imageSrc: `data:image/png;base64,${readFileSync('assets/images/logo.png').toString('base64')}`,
        maintenanceRealisation,
        countDates,
        headerColumnCount: countDates.length * 2,
        period: maintenanceRealisation.maintenancePeriod,
        createdBy: userCreatedRoleName,
        approvals: FlattenedApprovals,
        currentDate: `${new Date().getDate()} ${convertMonthToName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`,
      });

      await page.setContent(content);
      const pdfBuffer = await page.pdf({
        format: 'A3',
        landscape: true,
        printBackground: true,
        margin: { top: '1cm', right: '0', bottom: '100px', left: '0' },
        displayHeaderFooter: false,
        headerTemplate: '<div/>',
        // footerTemplate: `<div style="text-align: left;width: 197mm;font-size: 8px;margin-left: 100rem">Putih : DPA </div><div style="text-align: left;width: 297mm;font-size: 8px;">Kuning : Nahkoda </div><div style="text-align: right;width: 297mm;font-size: 8px;">Page <span style="margin-right: 1cm"><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      });

      await browser.close();
      return pdfBuffer;
    } catch (err) {
      console.log('err', err);
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
