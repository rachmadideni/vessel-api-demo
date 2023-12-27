import { HttpException, HttpStatus, Injectable, Req, Res, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import * as puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import compileHbs from 'src/common/utils/pdf';
import { convertMonthToName } from 'src/common/utils/date';

import { DamageReport } from './entities/damage-report.entity';
import { Ship } from '../ship/entities/ship.entity';
import { DamageType } from './entities/damage-type.entity';
import { DamageCause } from './entities/damage-cause.entity';
import { DamageRepairPlan } from './entities/damage-repair-plan.entity';
import { DamagePhotos } from './entities/damage-photos.entity';
import { User } from '../users/entities/user.entity';
import { DamageReportApprovals } from './entities/damage-report-approvals.entity';
import { Role } from '../roles/entities/role.entity';

import { CreateDamageFormDto } from './dto/create-damage-form.dto';
import { UpdateDamageFormDto } from './dto/update-damage-form.dto';
import { ApprovalsDto } from './dto/approvals.dto';
import { CreateApprovalsDto } from './dto/create-approval.dto';
// import { UpdateApprovalsDto } from './dto/update-approvals.dto';
import { UpdateDmrApprovalsDto } from './dto/update-approvals.dto';

// custom repository
// import { DamageRepository } from './repository/damage-reporting.repository';

@Injectable()
export class DamageReportingService {
  constructor(
    @InjectRepository(DamageReport) private repairRepo: Repository<DamageReport>,
    // @InjectRepository(DamageReport) private readonly customRepairRepo: DamageRepository,
    @InjectRepository(Ship) private shipRepo: Repository<Ship>,
    @InjectRepository(DamageType) private damageTypeRepo: Repository<DamageType>,
    @InjectRepository(DamageRepairPlan) private damageRepairPlanRepo: Repository<DamageRepairPlan>,
    @InjectRepository(DamageCause) private damageCauseRepo: Repository<DamageCause>,
    @InjectRepository(DamagePhotos) private damagePhotosRepo: Repository<DamagePhotos>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(DamageReportApprovals) private readonly damageReportApprovalsRepo: Repository<DamageReportApprovals>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>
  ) {}
  async create(createDamageFormDto: CreateDamageFormDto) {
    // const test = this.shipRepo.createQueryBuilder('s').where('s.id = :id', { id: createDamageFormDto.shipId });
    // console.log(test.getSql());

    const ship = await this.shipRepo.findOne({ where: { id: createDamageFormDto.shipId }, select: ['id', 'name'] });

    if (!ship) {
      throw new HttpException('Ship not found or maybe it is deleted', HttpStatus.NOT_FOUND);
    }

    const isFormNumberExist = await this.repairRepo.findOne({ where: { formNumber: createDamageFormDto.formNumber } });
    if (isFormNumberExist) {
      throw new HttpException('Form number already exist', HttpStatus.BAD_REQUEST);
    }

    const dmr = new DamageReport();
    dmr.ship = ship;
    dmr.reportDate = createDamageFormDto.reportDate;
    dmr.effectiveDate = createDamageFormDto.effectiveDate;
    dmr.eventDate = createDamageFormDto.eventDate;
    dmr.revision = createDamageFormDto.revision;
    dmr.formNumber = createDamageFormDto.formNumber;
    dmr.documentNumber = createDamageFormDto.formNumber;
    dmr.port = createDamageFormDto.port;
    dmr.notes = createDamageFormDto.notes;

    const dmrResult = await this.repairRepo.save(dmr);

    for (const damageType of createDamageFormDto.damageType) {
      const damageTypeEntity = new DamageType();
      damageTypeEntity.name = damageType;
      damageTypeEntity.damageReport = dmrResult;
      await this.damageTypeRepo.save(damageTypeEntity);
    }

    for (const damageCause of createDamageFormDto.damageCause) {
      const damageCauseEntity = new DamageCause();
      damageCauseEntity.name = damageCause;
      damageCauseEntity.damageReport = dmrResult;
      await this.damageCauseRepo.save(damageCauseEntity);
    }

    for (const damageRepairPlan of createDamageFormDto.damageRepairPlan) {
      const damageRepairPlanEntity = new DamageRepairPlan();
      damageRepairPlanEntity.name = damageRepairPlan;
      damageRepairPlanEntity.damageReport = dmrResult;
      await this.damageRepairPlanRepo.save(damageRepairPlanEntity);
    }

    return dmrResult;
  }

  async uploadRepairFormFiles(files: Express.Multer.File[]) {
    const uploadFileNames: string[] = [];
    for (const file of files) {
      uploadFileNames.push(file.filename);
    }
    return uploadFileNames;
  }

  async saveUploadedFormFiles(formId: string, files: Express.Multer.File[]) {
    const repairForm = await this.repairRepo.findOne({ where: { id: formId } });
    try {
      for (const file of files) {
        const photo = new DamagePhotos();
        photo.photo = file.filename;
        photo.damageReport = repairForm;
        photo.size = file.size;
        await this.damagePhotosRepo.save(photo);
      }
    } catch (err) {}
  }

  async getForm(id: string) {
    // const test = this.repairRepo.createQueryBuilder('r').leftJoinAndSelect('r.damageType', 'damageType').where('r.id = :id', { id });
    // console.log(test.getSql());

    const form = await this.repairRepo.find({
      where: { id },
      relations: ['ship', 'damageType', 'damageCause', 'damageRepairPlan', 'damagePhoto', 'approvals'],
      select: {
        ship: {
          id: true,
          name: true,
        },
        damageType: {
          createdAt: false,
          updatedAt: false,
        },
        damageCause: {
          createdAt: false,
          updatedAt: false,
        },
        damageRepairPlan: {
          createdAt: false,
          updatedAt: false,
        },
        deletedAt: false,
        approvals: {
          user: {
            id: true,
            firstName: true,
            lastName: true,
            password: false,
            email: false,
            title: false,
            refreshToken: false,
            createdAt: false,
            updatedAt: false,
            deletedAt: false,
          },
          role: {
            id: true,
            name: true,
            description: false,
            createdAt: false,
            updatedAt: false,
            deletedAt: false,
          },
        },
      },
      order: {
        damageType: {
          createdAt: 'ASC',
        },
        damageCause: {
          createdAt: 'ASC',
        },
        damageRepairPlan: {
          createdAt: 'ASC',
        },
        approvals: {
          order: 'ASC',
        },
      },
    });
    return form;
  }

  async deleteForm(id: string) {
    return await this.repairRepo.delete({ id });
  }

  async updateForm(id: string, request: UpdateDamageFormDto) {
    const ship = await this.shipRepo.findOne({ where: { id: request.shipId }, select: ['id', 'name'] });
    if (!ship) {
      throw new HttpException('Ship not found or maybe it is deleted', HttpStatus.NOT_FOUND);
    }

    const dmr = await this.repairRepo.findOne({ where: { id } });
    dmr.ship = ship;
    dmr.reportDate = request.reportDate;
    dmr.effectiveDate = request.effectiveDate;
    dmr.eventDate = request.eventDate;
    dmr.revision = request.revision;
    dmr.formNumber = request.formNumber;
    dmr.documentNumber = request.documentNumber;
    dmr.port = request.port;
    dmr.notes = request.notes;

    const dmrResult = await this.repairRepo.save(dmr);

    // handles delete request if any
    if (request.deletedIds) {
      if ('damageTypes' in request.deletedIds) {
        if (Array.isArray(request.deletedIds.damageTypes) && request.deletedIds.damageTypes.length > 0) {
          const { damageTypes } = request.deletedIds;
          damageTypes.forEach(async (id) => {
            await this.damageTypeRepo.delete({ id });
          });
        }
      }

      if ('damageCauses' in request.deletedIds) {
        if (Array.isArray(request.deletedIds.damageCauses) && request.deletedIds.damageCauses.length > 0) {
          const { damageCauses } = request.deletedIds;
          damageCauses.forEach(async (id) => {
            await this.damageCauseRepo.delete({ id });
          });
        }
      }

      if ('damageRepairPlans' in request.deletedIds) {
        if (Array.isArray(request.deletedIds.damageRepairPlans) && request.deletedIds.damageRepairPlans.length > 0) {
          const { damageRepairPlans } = request.deletedIds;
          damageRepairPlans.forEach(async (id) => {
            await this.damageRepairPlanRepo.delete({ id });
          });
        }
      }
    }

    // handles updated request if any
    if (request.updatedIds) {
      if ('damageTypes' in request.updatedIds) {
        if (Array.isArray(request.updatedIds.damageTypes) && request.updatedIds.damageTypes.length > 0) {
          const { damageTypes } = request.updatedIds;
          damageTypes.forEach(async (item) => {
            await this.damageTypeRepo.update({ id: item.id }, { name: item.value });
          });
        }
      }

      if ('damageCauses' in request.updatedIds) {
        if (Array.isArray(request.updatedIds.damageCauses) && request.updatedIds.damageCauses.length > 0) {
          const { damageCauses } = request.updatedIds;
          damageCauses.forEach(async (item) => {
            await this.damageCauseRepo.update({ id: item.id }, { name: item.value });
          });
        }
      }

      if ('damageRepairPlans' in request.updatedIds) {
        if (Array.isArray(request.updatedIds.damageRepairPlans) && request.updatedIds.damageRepairPlans.length > 0) {
          const { damageRepairPlans } = request.updatedIds;
          damageRepairPlans.forEach(async (item) => {
            await this.damageRepairPlanRepo.update({ id: item.id }, { name: item.value });
          });
        }
      }
    }

    // handles new request if any
    for (const damageType of request.damageType) {
      const newDamageTypeEntity = new DamageType();
      newDamageTypeEntity.name = damageType;
      newDamageTypeEntity.damageReport = dmrResult;
      await this.damageTypeRepo.save(newDamageTypeEntity);
    }

    for (const damageCause of request.damageCause) {
      const newDamageCauseEntity = new DamageCause();
      newDamageCauseEntity.name = damageCause;
      newDamageCauseEntity.damageReport = dmrResult;
      await this.damageCauseRepo.save(newDamageCauseEntity);
    }

    for (const damageRepairPlan of request.damageRepairPlan) {
      const newDamageRepairPlanEntity = new DamageRepairPlan();
      newDamageRepairPlanEntity.name = damageRepairPlan;
      newDamageRepairPlanEntity.damageReport = dmrResult;
      await this.damageRepairPlanRepo.save(newDamageRepairPlanEntity);
    }

    const updatedResult = await this.repairRepo.findOne({
      where: {
        id: dmrResult.id,
      },
      relations: ['ship', 'damageType', 'damageCause', 'damageRepairPlan'],
      select: {
        ship: {
          id: true,
          name: true,
        },
        damageType: {
          createdAt: false,
          updatedAt: false,
        },
        damageCause: {
          createdAt: false,
          updatedAt: false,
        },
        damageRepairPlan: {
          createdAt: false,
          updatedAt: false,
        },
      },
      order: {
        damageType: {
          createdAt: 'ASC',
        },
        damageCause: {
          createdAt: 'ASC',
        },
        damageRepairPlan: {
          createdAt: 'ASC',
        },
      },
    });

    return updatedResult;
  }

  async findFile(fileId: string) {
    return await this.damagePhotosRepo.findOne({ where: { id: fileId } });
  }

  async removeFileRefs(fileId: string) {
    return await this.damagePhotosRepo.delete({ id: fileId });
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<DamageReport>> {
    return paginate<DamageReport>(this.repairRepo, options);
  }

  async generatePDF(id: string) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });

      const page = await browser.newPage();

      const damageReport = await this.repairRepo.findOne({
        where: {
          id,
        },
        relations: ['approvals.user'],
      });

      const approvalRoles = [];
      for (const approval of damageReport.approvals) {
        const user = await this.userRepo.findOne({
          where: {
            id: approval.user.id,
          },
          relations: ['roles'],
        });

        approvalRoles.push(user.roles[0].name);
      }

      const approvals = damageReport.approvals.map((item, id) => ({
        desc: item.desc,
        name: `${item.user.firstName.trim()} ${item.user.lastName.trim()}`,
        role: approvalRoles[id],
      }));

      const damageTypes = damageReport.damageType.map((item) => item.name);

      for (let i = 0; i < 4; i++) {
        if (i > damageTypes.length) {
          damageTypes.push('');
        }
      }

      const damageCauses = damageReport.damageCause.map((item) => item.name);
      for (let i = 0; i < 4; i++) {
        if (i > damageCauses.length) {
          damageCauses.push('');
        }
      }

      const damageRepairPlan = damageReport.damageRepairPlan.map((item) => item.name) || [];
      for (let i = 0; i < 4; i++) {
        if (i > damageRepairPlan.length) {
          damageRepairPlan.push('');
        }
      }

      // array of photos
      const damagePhotos =
        damageReport.damagePhoto.map((item) => {
          return {
            name: item.photo,
            url: `data:image/png;base64,${readFileSync('storage/files/' + item.photo).toString('base64')}`,
          };
        }) || [];

      const content = await compileHbs('report_damage_form', {
        imageSrc: `data:image/png;base64,${readFileSync('assets/images/logo.png').toString('base64')}`,
        damageReport,
        damageTypes,
        damageCauses,
        damageRepairPlan,
        damagePhotos,
        approvals,
        currentDate: `${new Date().getDate()} ${convertMonthToName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`,
      });

      await page.setContent(content);

      // generate the PDF
      const pdfBuffer = await page.pdf({
        format: 'LEGAL',
        landscape: false,
        printBackground: false,
        margin: { top: '1cm', right: '0', bottom: '1cm', left: '0' },
        displayHeaderFooter: true,
        headerTemplate: '<div/>',
        footerTemplate: `<div style="text-align: left;width: 197mm;font-size: 8px;margin-left: 100rem">Putih : DPA </div><div style="text-align: left;width: 297mm;font-size: 8px;">Kuning : Nahkoda </div><div style="text-align: right;width: 297mm;font-size: 8px;">Page <span style="margin-right: 1cm"><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      });

      // close the browser
      await browser.close();

      return pdfBuffer;
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllForms(users: any) {
    try {
      const hasRoleSuperAdmin = await users[0].role.some((item) => item.name === 'Superadmin');
      const shipId = await users[1]?.shipId;
      const queryBuilder = this.repairRepo.createQueryBuilder('r').leftJoinAndSelect('r.ship', 'ship').select(['r.id', 'r.formNumber', 'ship.id', 'ship.name']);

      if (!hasRoleSuperAdmin) {
        queryBuilder.where('ship.id = :shipId', { shipId });
      }

      const repairs = await queryBuilder.getMany();

      return repairs;
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async approve(id: string, request: CreateApprovalsDto) {
    const dmr = await this.repairRepo.findOne({ where: { id } });

    for (const approvals of request.approvals) {
      const user = await this.userRepo.findOne({
        where: {
          id: approvals.userId,
        },
      });

      if (!user) throw new NotFoundException(`User is not found`);

      const role = await this.roleRepo.findOne({
        where: {
          id: approvals.roleId,
        },
      });

      if (!role) throw new NotFoundException('Role not found');

      const dmrApprovals = new DamageReportApprovals();
      dmrApprovals.user = user;
      dmrApprovals.role = role;
      dmrApprovals.damageReport = dmr;
      dmrApprovals.order = approvals.order;
      dmrApprovals.desc = approvals.desc;
      await this.damageReportApprovalsRepo.save(dmrApprovals);
    }

    const approveResult = await this.damageReportApprovalsRepo.find({
      where: {
        damageReport: {
          id,
        },
      },
      relations: ['user'],
      select: {
        user: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    const results = approveResult.map((item) => ({
      id: item.id,
      order: item.order,
      desc: item.desc,
      userId: item.user.id,
      roleId: item.role.id,
      fullName: `${item.user.firstName} ${item.user.lastName}`,
    }));

    return results;
  }

  async updateApprovals(id: string, request: UpdateDmrApprovalsDto) {
    for (const approval of request.approvals) {
      const currentApproval = await this.damageReportApprovalsRepo.findOne({ where: { id: approval.id } });
      if (!currentApproval) throw new HttpException(`Approval id of ${approval.id} is not found`, HttpStatus.NOT_FOUND);

      const user = await this.userRepo.findOne({
        where: {
          id: approval.userId,
        },
      });

      if (!user) throw new HttpException(`User id of ${approval.userId} is not found`, HttpStatus.NOT_FOUND);

      const role = await this.roleRepo.findOne({
        where: {
          id: approval.roleId,
        },
      });

      if (!role) throw new HttpException(`Role Id of ${approval.roleId} is not found`, HttpStatus.NOT_FOUND);

      await this.damageReportApprovalsRepo.update({ id: approval.id }, { user, role, order: approval.order, desc: approval.desc });
    }

    const updateResult = await this.damageReportApprovalsRepo.find({
      where: {
        damageReport: {
          id,
        },
      },
      relations: ['user'],
      select: {
        user: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    const results = updateResult.map((item) => ({
      id: item.id,
      order: item.order,
      desc: item.desc,
      userId: item.user.id,
      roleId: item.role.id,
      fullName: `${item.user.firstName} ${item.user.lastName}`,
    }));

    return results;
  }
}
