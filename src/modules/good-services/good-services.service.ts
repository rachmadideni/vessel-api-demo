import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { GoodServices } from './entities/good-services.entity';
import { GoodServicesItem } from './entities/good-services-item.entity';
import { GoodServicesApprovals } from './entities/good-services-approvals';
import { DamageReport } from '../damage-reporting/entities/damage-report.entity';
import { CreateGoodServicesDto } from './dto/create-good-services.dto';
import { UpdateGoodServicesDto } from './dto/update-good-services.dto';
import { Part } from '../part/entities/part.entity';
import { Ship } from '../ship/entities/ship.entity';
import { Sections } from '../common/entities/sections.entity';
import { Role } from '../roles/entities/role.entity';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { GsApprovalsDto } from './dto/approvals.dto';
import { UpdateGsApprovalsDto } from './dto/update-approvals.dto';
import { User } from '../users/entities/user.entity';

import * as puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import compileHbs from 'src/common/utils/pdf';
import { convertMonthToName } from 'src/common/utils/date';

@Injectable()
export class GoodServicesService {
  constructor(
    @InjectRepository(GoodServices) private goodServicesRepo: Repository<GoodServices>,
    @InjectRepository(GoodServicesItem) private goodServicesItemRepo: Repository<GoodServicesItem>,
    @InjectRepository(GoodServicesApprovals) private goodServicesApprovalsRepo: Repository<GoodServicesApprovals>,
    @InjectRepository(DamageReport) private damageReportRepo: Repository<DamageReport>,
    @InjectRepository(Part) private partRepo: Repository<Part>,
    @InjectRepository(Ship) private shipRepo: Repository<Ship>,
    @InjectRepository(Sections) private sectionRepo: Repository<Sections>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(User) private userRepo: Repository<User>
  ) {}

  async paginate(options: IPaginationOptions, users: any): Promise<Pagination<GoodServices>> {
    // const goodServices = this.goodServicesRepo
    //   .createQueryBuilder('goodServices')
    //   .leftJoinAndSelect('goodServices.items', 'items')
    //   .leftJoinAndSelect('goodServices.vessel', 'vessel')
    //   .leftJoinAndSelect('goodServices.section', 'section')
    //   .leftJoinAndSelect('goodServices.referenceNumber', 'refNo')
    //   .leftJoinAndSelect('goodServices.approvals', 'approvals')
    //   .leftJoinAndSelect('items.part', 'part')
    //   .select(['goodServices', 'items', 'part.id', 'part.number', 'part.description', 'vessel.id', 'vessel.name', 'section', 'refNo.id', 'refNo.formNumber', 'approvals']);
    // return paginate<GoodServices>(goodServices, options);

    const hasRoleSuperAdmin = await users[0].role.some((item: { name: string }) => item.name === 'Superadmin');
    const shipId = await users[1]?.shipId;

    const queryOptions: FindManyOptions<GoodServices> = {
      relations: ['items', 'vessel', 'section', 'referenceNumber', 'approvals'],
      select: {
        id: true,
        effectiveDate: true,
        proposedDate: true,
        formNumber: true,
        documentNumber: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        items: true,
        vessel: {
          id: true,
          name: true,
        },
      },
    };

    if (!hasRoleSuperAdmin) {
      queryOptions.where = {
        vessel: {
          id: shipId,
        },
      };
    }

    return paginate<GoodServices>(this.goodServicesRepo, options, queryOptions);
  }

  async create(request: CreateGoodServicesDto, userId: string) {
    if (!userId) throw new BadRequestException('Token User id cannot be empty');

    const createdBy = await this.userRepo.findOne({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!createdBy) throw new BadRequestException('User not found');

    if (request.items.length === 0) throw new BadRequestException('Items cannot be empty');

    const vessel = await this.shipRepo.findOne({
      where: {
        id: request.vesselId,
      },
    });

    if (!vessel) throw new BadRequestException(['Vessel not found']);

    if (request.items) {
      for (const item of request.items) {
        const part = await this.partRepo.findOne({
          where: {
            id: item.partId,
            ship: {
              id: vessel.id,
            },
          },
        });

        if (!part) throw new BadRequestException(['Invalid part id']);
      }
    }

    // const dmr = await this.damageReportRepo.findOne({
    //   where: {
    //     id: request.referenceNumber,
    //     ship: {
    //       id: vessel.id,
    //     },
    //   },
    //   select: {
    //     id: true,
    //   },
    // });

    // // tidak ditemukan data form number laporan kerusakan dengan ship ini
    // if (!dmr) throw new BadRequestException(['Invalid reference number or ship id']);

    const section = await this.sectionRepo.findOne({
      where: {
        id: request.sectionId,
      },
    });

    if (!section) throw new BadRequestException(['Section not found']);

    // checks each part for errors

    const goodServices = new GoodServices();
    goodServices.vessel = vessel;
    goodServices.documentNumber = request.documentNumber;
    goodServices.formNumber = request.formNumber;
    // goodServices.referenceNumber = dmr;
    goodServices.effectiveDate = request.effectiveDate;
    goodServices.proposedDate = request.proposedDate;
    goodServices.section = section;
    goodServices.notes = request.notes;
    goodServices.createdBy = createdBy.id;

    const goodServicesResult = await this.goodServicesRepo.save(goodServices);

    for (const item of request.items) {
      const part = await this.partRepo.findOne({
        where: {
          id: item.partId,
          ship: {
            id: vessel.id,
          },
        },
      });

      if (!part) throw new BadRequestException(['Invalid part id']);

      const goodServicesItem = new GoodServicesItem();
      goodServicesItem.goodServices = goodServicesResult;
      goodServicesItem.usagePlanDate = item.usagePlanDate;
      goodServicesItem.estimatedPartPrice = item.estimatedPartPrice;
      goodServicesItem.orderedQuantity = item.orderedQuantity;
      goodServicesItem.part = part;
      await this.goodServicesItemRepo.save(goodServicesItem);
    }

    return goodServicesResult;
  }

  async findById(id: string) {
    const goodServices = await this.goodServicesRepo
      .createQueryBuilder('goodServices')
      .leftJoinAndSelect('goodServices.items', 'items')
      .leftJoinAndSelect('goodServices.vessel', 'vessel')
      .leftJoinAndSelect('goodServices.section', 'section')
      // .leftJoinAndSelect('goodServices.referenceNumber', 'refNo')
      .leftJoinAndSelect('goodServices.approvals', 'approvals')
      .leftJoinAndSelect('approvals.user', 'approvalsUser')
      .leftJoinAndSelect('approvals.role', 'approvalsRoles')
      .leftJoinAndSelect('items.part', 'part')
      .leftJoinAndSelect('part.partUnit', 'partUnit')
      .andWhere('goodServices.id = :id', { id })
      .select([
        'goodServices',
        'items',
        'part.id',
        'part.number',
        'part.description',
        'partUnit.name',
        'vessel.id',
        'vessel.name',
        'section',
        // 'refNo.id',
        // 'refNo.formNumber',
        'approvals',
        'approvalsUser.id',
        'approvalsUser.firstName',
        'approvalsUser.lastName',
        'approvalsRoles.id',
        'approvalsRoles.name',
      ])
      .orderBy('items.createdAt', 'ASC')
      .orderBy('approvals.order', 'ASC')
      .getOne();

    const findUser = await this.userRepo.findOne({
      relations: ['roles'],
      where: {
        id: goodServices?.createdBy,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        roles: true,
      },
    });

    const user = {
      name: `${findUser.firstName} ${findUser.lastName}`,
      role: findUser.roles.find((role) => !role !== undefined),
    };

    const results = { ...goodServices, user };
    return results;
  }

  async deleteGoodServices(id: string) {
    if (!id) throw new BadRequestException('Id cannot be empty');
    const result = await this.goodServicesRepo.findOne({
      where: {
        id: id,
      },
    });

    if (!result) throw new NotFoundException('Good Services not found');
    return await this.goodServicesRepo.delete(id);
  }

  async updateGoodServices(id: string, request: UpdateGoodServicesDto) {
    const goodServices = await this.goodServicesRepo.findOne({
      where: {
        id: id,
      },
    });

    if (!goodServices) throw new NotFoundException('Good Services not found');

    const vessel = await this.shipRepo.findOne({
      where: {
        id: request.vesselId,
      },
    });

    if (!vessel) throw new BadRequestException(['Vessel not found']);

    const section = await this.sectionRepo.findOne({
      where: {
        id: request.sectionId,
      },
    });

    if (!section) throw new BadRequestException(['Section not found']);

    // checks each part for errors

    if (request.items) {
      for (const item of request.items) {
        const part = await this.partRepo.findOne({
          where: {
            id: item.partId,
            ship: {
              id: vessel.id,
            },
          },
        });

        if (!part) throw new BadRequestException(['Invalid part id']);
      }
    }

    // const dmr = await this.damageReportRepo.findOne({
    //   where: {
    //     id: request.referenceNumber,
    //     ship: {
    //       id: vessel.id,
    //     },
    //   },
    //   select: {
    //     id: true,
    //   },
    // });

    // if (!dmr) throw new BadRequestException(['Invalid reference number or ship id']);
    goodServices.vessel = vessel;
    goodServices.effectiveDate = request.effectiveDate;
    goodServices.proposedDate = request.proposedDate;
    goodServices.formNumber = request.formNumber;
    // goodServices.referenceNumber = dmr;
    goodServices.documentNumber = request.documentNumber;
    goodServices.section = section;
    goodServices.notes = request.notes;
    await this.goodServicesRepo.save(goodServices);
    // const updatedGoodServices = await this.goodServicesRepo.save(goodServices);

    if (request.deletedIds) {
      for (const deletedId of request.deletedIds) {
        await this.goodServicesItemRepo.delete(deletedId);
      }
    }

    if (request.updatedIds) {
      // checks if we have items to be updated
      if (Array.isArray(request.updatedIds.items) && request.updatedIds.items.length > 0) {
        // loop each item
        for (const item of request.updatedIds.items) {
          // checks if part id is valid
          const part = await this.partRepo.findOne({
            where: {
              id: item.partId,
              ship: {
                id: vessel.id,
              },
            },
          });

          if (!part) throw new NotFoundException('Invalid part id or part data is not found');
          await this.goodServicesItemRepo.update(
            { id: item.id },
            {
              usagePlanDate: item.usagePlanDate,
              estimatedPartPrice: item.estimatedPartPrice,
              orderedQuantity: item.orderedQuantity,
              part: {
                id: item.partId,
              },
            }
          );
        }
      }
    }

    if (request.items) {
      for (const item of request.items) {
        const part = await this.partRepo.findOne({
          where: {
            id: item.partId,
            ship: {
              id: vessel.id,
            },
          },
        });

        if (!part) {
          throw new BadRequestException(['Invalid part id']);
        } else {
          const goodServicesItem = new GoodServicesItem();
          goodServicesItem.goodServices = goodServices;
          goodServicesItem.usagePlanDate = item.usagePlanDate;
          goodServicesItem.estimatedPartPrice = item.estimatedPartPrice;
          goodServicesItem.orderedQuantity = item.orderedQuantity;
          goodServicesItem.part = part;
          await this.goodServicesItemRepo.save(goodServicesItem);
        }
      }
    }

    return await this.findById(id);
  }

  async approve(id: string, request: GsApprovalsDto) {
    const goodServices = await this.goodServicesRepo.findOne({
      where: {
        id,
      },
    });

    if (!goodServices) throw new NotFoundException('Good Services not found');

    for (const approvals of request.approvals) {
      const user = await this.userRepo.findOne({
        where: {
          id: approvals.userId,
        },
      });

      if (!user) throw new NotFoundException('User not found');

      const role = await this.roleRepo.findOne({
        where: {
          id: approvals.roleId,
        },
      });

      if (!role) throw new NotFoundException('Role not found');

      const goodServicesApprovals = new GoodServicesApprovals();
      goodServicesApprovals.user = user;
      goodServicesApprovals.role = role;
      goodServicesApprovals.order = approvals.order;
      goodServicesApprovals.desc = approvals.desc;
      goodServicesApprovals.goodServices = goodServices;
      await this.goodServicesApprovalsRepo.save(goodServicesApprovals);
    }

    return await this.findApprovals(id);
  }

  async updateApprovals(id: string, request: UpdateGsApprovalsDto) {
    for (const approval of request.approvals) {
      const currentApproval = await this.goodServicesApprovalsRepo.findOne({
        where: {
          id: approval.id,
        },
      });
      if (!currentApproval) throw new HttpException(`Approval id of ${approval.id} is not found`, HttpStatus.NOT_FOUND);

      const user = await this.userRepo.findOne({
        where: {
          id: approval.userId,
        },
      });

      if (!user) throw new HttpException(`User Id of ${approval.userId} is not found`, HttpStatus.NOT_FOUND);

      const role = await this.roleRepo.findOne({
        where: {
          id: approval.roleId,
        },
      });

      if (!role) throw new HttpException(`Role Id of ${approval.roleId} is not found`, HttpStatus.NOT_FOUND);
      await this.goodServicesApprovalsRepo.update(
        {
          id: approval.id,
        },
        {
          user,
          role,
          order: approval.order,
          desc: approval.desc,
        }
      );
    }

    return await this.findApprovals(id);
  }

  async findApprovals(id: string) {
    const goodServices = await this.goodServicesRepo
      .createQueryBuilder('goodServices')
      .leftJoinAndSelect('goodServices.approvals', 'approvals')
      .leftJoinAndSelect('approvals.user', 'approvalsUser')
      .leftJoinAndSelect('approvals.role', 'approvalsRoles')
      .andWhere('goodServices.id = :id', { id })
      .select(['goodServices', 'approvals', 'approvalsUser.id', 'approvalsUser.firstName', 'approvalsUser.lastName', 'approvalsRoles.id', 'approvalsRoles.name'])
      .orderBy('approvals.order', 'ASC')
      .getOne();

    return goodServices;
  }

  async generatePDF(id: string) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });

      const page = await browser.newPage();

      const data = await this.findById(id);
      const findUser = await this.userRepo.findOne({
        relations: ['roles'],
        where: {
          id: data?.createdBy,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          roles: true,
        },
      });

      const user = {
        name: `${findUser.firstName} ${findUser.lastName}`,
        role: findUser.roles.find((role) => !role !== undefined),
      };

      const content = await compileHbs('good_services', {
        imageSrc: `data:image/png;base64,${readFileSync('assets/images/logo.png').toString('base64')}`,
        currentDate: `${new Date().getDate()} ${convertMonthToName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`,
        data,
        user,
      });
      await page.setContent(content);

      const pdfBuffer = await page.pdf({
        format: 'LEGAL',
        landscape: false,
        printBackground: false,
        margin: { top: '0', right: '0', bottom: '1cm', left: '0' },
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
}
