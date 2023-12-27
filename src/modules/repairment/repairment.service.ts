import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { Repairment } from './entities/repairment.entity';
import { CreateRepairmentDto } from './dto/create-repairment.dto';
import { Ship } from '../ship/entities/ship.entity';
import { Sections } from '../common/entities/sections.entity';
import { CommonRepairmentReasons } from '../common/entities/repairment-reasons.entity';
import { RepairmentReasons } from './entities/repairment-reasons.entity';
import { RepairmentJobs } from './entities/repairment-jobs.entity';
import { RepairmentJobDetails } from './entities/repairment-job-details.entity';
import { RepairmentPhotos } from './entities/repairment-photos.entity';
import { RepairmentApprovals } from './entities/repairment-approvals.entity';
import { RepairmentMaterials } from './entities/repairment-materials.entity';
import { User } from '../users/entities/user.entity';
import { DamageReport } from '../damage-reporting/entities/damage-report.entity';
import { Role } from '../roles/entities/role.entity';
import { Part } from '../part/entities/part.entity';
import { UpdateRepairmentDto } from './dto/update-repairment.dto';
import { CreateRepairmentApprovalsDto } from './dto/approvals.dto';
import { UpdateRepairmentApprovalsDto } from './dto/update-approvals.dto';

import * as puppeteer from 'puppeteer';
import compileHbs from 'src/common/utils/pdf';
import { readFileSync } from 'fs';

@Injectable()
export class RepairmentService {
  constructor(
    @InjectRepository(Repairment) private readonly repairmentRepository: Repository<Repairment>,
    @InjectRepository(RepairmentReasons) private readonly reasonRepo: Repository<RepairmentReasons>,
    @InjectRepository(RepairmentJobs) private readonly jobRepo: Repository<RepairmentJobs>,
    @InjectRepository(RepairmentJobDetails) private readonly jobDetailRepo: Repository<RepairmentJobDetails>,
    @InjectRepository(RepairmentPhotos) private readonly photoRepo: Repository<RepairmentPhotos>,
    @InjectRepository(Ship) private readonly shipRepository: Repository<Ship>,
    @InjectRepository(Sections) private readonly commonSectionsRepo: Repository<Sections>,
    @InjectRepository(CommonRepairmentReasons) private readonly commonReasonsRepo: Repository<CommonRepairmentReasons>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RepairmentApprovals) private readonly repairmentApprovalRepo: Repository<RepairmentApprovals>,
    @InjectRepository(DamageReport) private readonly damageReportRepo: Repository<DamageReport>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Part) private readonly partRepo: Repository<Part>,
    @InjectRepository(RepairmentMaterials) private readonly repairmentMaterialsRepo: Repository<RepairmentMaterials>
  ) {}

  async paginate(options: IPaginationOptions): Promise<Pagination<Repairment>> {
    // const repairment = this.repairmentRepository
    //   .createQueryBuilder('rep')
    //   .leftJoinAndSelect('rep.damageReport', 'dmr')
    //   .leftJoinAndSelect('rep.repairmentJobs', 'repJob')
    //   .leftJoinAndSelect('repJob.details', 'repJobDetails')
    //   .leftJoinAndSelect('rep.repairmentPhotos', 'repPhoto')
    //   .leftJoinAndSelect('rep.repairmentReasons', 'repReasons')
    //   .leftJoinAndSelect('repReasons.commonRepairmentReason', 'repCommonReasons')
    //   .leftJoinAndSelect('rep.repairmentApprovals', 'repApprovals')
    //   .leftJoinAndSelect('dmr.ship', 'dmrShip')
    //   .select(['rep', 'dmr.id', 'dmr.formNumber', 'dmrShip.name', 'repJob', 'repJobDetails', 'repPhoto', 'repReasons', 'repCommonReasons', 'repApprovals']);
    // console.log(repairment.getSql());
    return paginate<Repairment>(this.repairmentRepository, options);
  }

  async getRepairmentById(id: string) {
    const response = await this.repairmentRepository.findOne({
      where: {
        id,
      },
      relations: ['ship', 'section', 'repairmentJobs', 'repairmentJobs.details', 'repairmentPhotos', 'repairmentPhotos', 'repairmentApprovals', 'repairmentApprovals.user', 'repairmentReasons'],
      select: {
        repairmentApprovals: {
          user: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      order: {
        repairmentJobs: {
          createdAt: 'ASC',
          details: {
            createdAt: 'ASC',
          },
        },
        repairmentApprovals: {
          order: 'ASC',
        },
      },
    });

    if (response) {
      response.repairmentReasons.sort((a, b) => {
        const idA = a.commonRepairmentReason ? a.commonRepairmentReason.id : 0;
        const idB = b.commonRepairmentReason ? b.commonRepairmentReason.id : 0;
        return idA - idB;
      });
      return response;
    }
  }

  async deleteRepairment(id: string) {
    try {
      const isDeleted = await this.repairmentRepository.delete({ id });
      if (isDeleted.affected !== 1) throw new HttpException('Failed to delete repairment', HttpStatus.INTERNAL_SERVER_ERROR);
      return {
        statusCode: HttpStatus.OK,
        message: 'Repairment deleted successfully',
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createRepairment(request: CreateRepairmentDto) {
    // checks ship is exist
    const ship = await this.shipRepository.findOne({
      where: { id: request.shipId },
    });

    if (!ship) {
      throw new HttpException('Ship not found', HttpStatus.NOT_FOUND);
    }

    // checks section is exist
    const section = await this.commonSectionsRepo.findOne({
      where: { id: request.sectionId },
    });

    if (!section) {
      throw new HttpException('Section not found', HttpStatus.NOT_FOUND);
    }

    const damageRpt = await this.damageReportRepo.findOne({
      where: {
        id: request.damageReportId,
      },
    });

    if (!damageRpt) {
      throw new HttpException('Damage report not found', HttpStatus.NOT_FOUND);
    }

    const repair = new Repairment();
    repair.ship = ship;
    repair.section = section;
    repair.completionDate = request.completionDate;
    // repair.materialDesc = request.materialDesc;
    repair.formNumber = request.formNumber;
    repair.documentNumber = request.documentNumber;
    repair.effectiveDate = request.effectiveDate;
    repair.revision = request.revision;
    repair.damageReport = damageRpt;

    const repairResult = await this.repairmentRepository.save(repair);

    // Repairment Reasons
    if (Array.isArray(request.reasons) && request.reasons.length > 0) {
      await Promise.all(
        request.reasons.map(async (reason) => {
          const reasonId = reason?.commonRepairmentReasonsId;
          const commonReason = await this.commonReasonsRepo.findOne({
            where: {
              id: reasonId,
            },
          });

          const reasonEntity = new RepairmentReasons();
          reasonEntity.commonRepairmentReason = commonReason;
          reasonEntity.reasonDate = reason.date;
          reasonEntity.reasonNumber = reason.number;
          reasonEntity.repairment = repairResult;
          reasonEntity.active = reason.active;
          await this.reasonRepo.save(reasonEntity);
        })
      );
    }

    // create payload for jobs & details in the same array
    if (Array.isArray(request.jobs) && request.jobs.length > 0) {
      for (const job of request.jobs) {
        const { name, details } = job;

        const jobEntity = new RepairmentJobs();
        jobEntity.name = name;
        jobEntity.repairment = repairResult;

        const jobResult = await this.jobRepo.save(jobEntity);

        if (details.length > 0) {
          for (const detail of details) {
            const jobDetailEntity = new RepairmentJobDetails();
            jobDetailEntity.name = detail;
            jobDetailEntity.repairmentJob = jobResult;
            await this.jobDetailRepo.save(jobDetailEntity);
          }
        }
      }
    }

    // handles repairment materials
    if (Array.isArray(request.materials) && request.materials.length > 0) {
      for (const material of request.materials) {
        const part = await this.partRepo.findOne({
          where: {
            id: material,
            // id: material.toString(),
          },
        });
        if (part) {
          const materialEntity = new RepairmentMaterials();
          materialEntity.part = part;
          materialEntity.repairment = repairResult;
          await this.repairmentMaterialsRepo.save(materialEntity);
        }
      }
    }

    const repairmentResponse = await this.repairmentRepository.findOne({
      where: {
        id: repairResult.id,
      },
      relations: ['ship', 'section', 'repairmentJobs', 'repairmentJobs.details', 'repairmentPhotos', 'repairmentPhotos', 'repairmentReasons', 'materials'],
      order: {
        repairmentJobs: {
          createdAt: 'ASC',
          details: {
            createdAt: 'ASC',
          },
        },
        materials: {
          createdAt: 'ASC',
        },
      },
    });

    if (repairmentResponse) {
      repairmentResponse.repairmentReasons.sort((a, b) => {
        const idA = a.commonRepairmentReason ? a.commonRepairmentReason.id : 0;
        const idB = b.commonRepairmentReason ? b.commonRepairmentReason.id : 0;
        return idA - idB;
      });
      return repairmentResponse;
    }
  }

  async updateRepairment(id: string, request: UpdateRepairmentDto) {
    const ship = await this.shipRepository.findOne({
      where: {
        id: request.shipId,
      },
    });

    if (!ship) {
      throw new HttpException('Ship not found', HttpStatus.NOT_FOUND);
    }

    const section = await this.commonSectionsRepo.findOne({
      where: {
        id: request.sectionId,
      },
    });

    if (!section) {
      throw new HttpException('Section not found', HttpStatus.NOT_FOUND);
    }

    const repairment = await this.repairmentRepository.findOne({
      where: {
        id,
      },
    });

    const damageRpt = await this.damageReportRepo.findOne({
      where: {
        id: request.damageReportId,
      },
    });

    if (!damageRpt) {
      throw new HttpException('Damage report not found', HttpStatus.NOT_FOUND);
    }

    repairment.section = section;
    repairment.completionDate = request.completionDate;
    // repairment.materialDesc = request.materialDesc;
    repairment.documentNumber = request.documentNumber;
    repairment.effectiveDate = request.effectiveDate;
    repairment.revision = request.revision;
    repairment.damageReport = damageRpt;
    // repairment.formNumber = request.formNumber;
    repairment.formNumber = damageRpt.formNumber;

    const repairmentResult = await this.repairmentRepository.save(repairment);

    // handles reasons upsert
    if (request.reasons.length > 0) {
      await this.reasonRepo.upsert(request.reasons, {
        conflictPaths: ['id'],
        skipUpdateIfNoValuesChanged: true,
      });
    }

    // handles new job & job details
    if (Array.isArray(request.jobs) && request.jobs.length > 0) {
      for (const job of request.jobs) {
        const { name, details } = job;

        const jobEntity = new RepairmentJobs();
        jobEntity.name = name;
        jobEntity.repairment = repairment;

        const jobResult = await this.jobRepo.save(jobEntity);

        if (details.length > 0) {
          for (const detail of details) {
            const jobDetailEntity = new RepairmentJobDetails();
            jobDetailEntity.name = detail;
            jobDetailEntity.repairmentJob = jobResult;
            await this.jobDetailRepo.save(jobDetailEntity);
          }
        }
      }
    }

    // handles new materials if any
    if (Array.isArray(request.materials) && request.materials.length > 0) {
      for (const material of request.materials) {
        const part = await this.partRepo.findOne({
          where: {
            // id: material.partId,
            id: material,
            ship: {
              id: request.shipId,
            },
          },
        });

        // check if part is not already exist
        const isPartAlreadyExist = await this.repairmentMaterialsRepo.findOne({
          where: {
            // id: material.partId,
            id: material,
            repairment: repairmentResult,
          },
        });

        if (part && !isPartAlreadyExist) {
          const materialEntity = new RepairmentMaterials();
          materialEntity.part = part;
          materialEntity.repairment = repairmentResult;
          await this.repairmentMaterialsRepo.save(materialEntity);
        }
      }
    }

    // handles deletd job id
    if (request.deletedIds.jobId.length > 0) {
      for (const jobId of request.deletedIds.jobId) {
        await this.jobRepo.delete({ id: jobId });
      }
    }
    // handles deleted job details
    if (request.deletedIds.jobDetailId.length > 0) {
      for (const jobDetailId of request.deletedIds.jobDetailId) {
        await this.jobDetailRepo.delete({ id: jobDetailId });
      }
    }

    // handles deleted materials
    if (request.deletedIds.materialsId.length > 0) {
      for (const material of request.deletedIds.materialsId) {
        const part = await this.partRepo.findOne({
          where: {
            id: material,
          },
        });

        // if (part) {
        await this.repairmentMaterialsRepo.delete({ part: part, repairment: repairmentResult });
        // }
      }
    }

    // handles the updated job details

    if (request.updatedIds) {
      if (Array.isArray(request.updatedIds.jobs) && request.updatedIds.jobs.length > 0) {
        for (const job of request.updatedIds.jobs) {
          if (job.details.length > 0) {
            const jobId = await this.jobRepo.findOne({
              where: {
                id: job.id,
              },
            });

            for (const detail of job.details) {
              const isJobDetail = await this.jobDetailRepo.findOne({
                where: {
                  id: detail.id,
                },
              });

              if (!isJobDetail) {
                await this.jobDetailRepo.save({
                  name: detail.name,
                  repairmentJob: jobId,
                });
              } else {
                await this.jobDetailRepo.update({ id: detail.id }, { name: detail.name });
              }
            }
          }
          await this.jobRepo.update({ id: job.id }, { name: job.name });
        }
      }

      // handles updated Materials
      if (Array.isArray(request.updatedIds.materials) && request.updatedIds.materials.length > 0) {
        for (const material of request.updatedIds.materials) {
          const part = await this.partRepo.findOne({
            where: {
              id: material.partId,
            },
          });

          if (part) {
            const existingRepMaterial = await this.repairmentMaterialsRepo.findOne({
              where: {
                id: material.id,
                // repairment: repairmentResult,
              },
            });

            /*
            await repository.update({ age: 18 }, { category: "ADULT" })
            -- executes UPDATE user SET category = ADULT WHERE age = 18
            */

            if (existingRepMaterial) {
              await this.repairmentMaterialsRepo.update({ id: material.id }, { part: material.partId });
            } else {
              const materialEntity = new RepairmentMaterials();
              materialEntity.part = part;
              materialEntity.repairment = repairmentResult;
              await this.repairmentMaterialsRepo.save(materialEntity);
            }
          }
        }
      }
    }

    const updatedResult = await this.repairmentRepository.findOne({
      where: {
        id: repairmentResult.id,
      },
      relations: ['ship', 'section', 'repairmentJobs', 'repairmentJobs.details', 'repairmentPhotos', 'repairmentPhotos', 'repairmentReasons', 'materials'],
      order: {
        repairmentJobs: {
          createdAt: 'ASC',
          details: {
            createdAt: 'ASC',
          },
        },
        materials: {
          createdAt: 'ASC',
        },
      },
    });

    if (updatedResult) {
      updatedResult.repairmentReasons.sort((a, b) => {
        const idA = a.commonRepairmentReason ? a.commonRepairmentReason.id : 0;
        const idB = b.commonRepairmentReason ? b.commonRepairmentReason.id : 0;
        return idA - idB;
      });
      return updatedResult;
    }
  }

  async saveUploadedFiles(id: string, files: Express.Multer.File[]) {
    const repairment = await this.repairmentRepository.findOne({
      where: {
        id: id,
      },
    });

    try {
      for (const file of files) {
        const photo = new RepairmentPhotos();
        photo.photo = file.filename;
        photo.repairment = repairment;
        photo.size = file.size;
        await this.photoRepo.save(photo);
      }
    } catch (err) {}
  }

  async findFile(fileId: string) {
    return await this.photoRepo.findOne({
      where: {
        id: fileId,
      },
    });
  }

  async removeFileRefs(fileId: string) {
    return await this.photoRepo.delete({ id: fileId });
  }

  async approveRepairment(id: string, request: CreateRepairmentApprovalsDto) {
    const repairment = await this.repairmentRepository.findOne({
      where: {
        id,
      },
    });

    for (const approvals of request.approvals) {
      const user = await this.userRepo.findOne({
        where: {
          id: approvals.userId,
        },
      });

      if (!user) throw new NotFoundException('user is not found');

      const role = await this.roleRepo.findOne({
        where: {
          id: approvals.roleId,
        },
      });

      if (!role) throw new NotFoundException('Role not found');

      const approvalsMeta = new RepairmentApprovals();
      approvalsMeta.user = user;
      approvalsMeta.role = role;
      approvalsMeta.repairment = repairment;
      approvalsMeta.order = approvals.order;
      approvalsMeta.desc = approvals.desc;
      await this.repairmentApprovalRepo.save(approvalsMeta);
    }

    const approveResult = await this.repairmentApprovalRepo.find({
      where: {
        repairment: {
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

  async updateRepairmentApproval(id: string, request: UpdateRepairmentApprovalsDto) {
    for (const approval of request.approvals) {
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

      await this.repairmentApprovalRepo.update({ id: approval.id }, { order: approval.order, desc: approval.desc, user, role });
    }

    const approveResult = await this.repairmentApprovalRepo.find({
      where: {
        repairment: {
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

  async generatePdf(id: string) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });

      const page = await browser.newPage();

      // data
      const repairment = await this.repairmentRepository.findOne({
        where: {
          id,
        },
        order: {
          repairmentReasons: {
            commonRepairmentReason: {
              id: 'ASC',
            },
          },
        },
        relations: ['ship', 'section', 'repairmentReasons', 'repairmentReasons.commonRepairmentReason', 'repairmentApprovals.user', 'repairmentPhotos'],
      });

      const approvalRoles = [];
      for (const appr of repairment.repairmentApprovals) {
        const users = await this.userRepo.findOne({
          where: {
            id: appr.user.id,
          },
          relations: ['roles'],
        });

        approvalRoles.push(users.roles[0].name);
      }

      const approvals = repairment.repairmentApprovals.map((item, id) => ({
        desc: item.desc,
        user: item.user.id,
        name: `${item.user.firstName.trim()} ${item.user.lastName.trim()}`,
        role: approvalRoles[id],
      }));

      const jobs = await this.jobRepo.find({
        where: {
          repairment: {
            id: repairment.id,
          },
        },
      });

      const photos =
        repairment.repairmentPhotos.map((item) => {
          return {
            name: item.photo,
            url: `data:image/png;base64,${readFileSync('storage/files/' + item.photo).toString('base64')}`,
          };
        }) || [];

      const materials =
        repairment.materials.map((item) => ({
          name: item.part.description,
        })) || [];

      const content = await compileHbs('report_repairment', {
        imageSrc: `data:image/png;base64,${readFileSync('assets/images/logo.png').toString('base64')}`,
        repairment,
        reasons: repairment?.repairmentReasons,
        jobs,
        approvals,
        photos,
        materials,
      });

      await page.setContent(content);
      const pdfBuffer = await page.pdf({
        format: 'LEGAL',
        landscape: false,
        printBackground: false,
        margin: { top: '1cm', right: '0', bottom: '3.5cm', left: '0' },
        displayHeaderFooter: true,
        headerTemplate: '<div/>',
        footerTemplate: `<div style="text-align: left;width: 197mm;font-size: 8px;margin-left: 100rem">Putih : DPA </div><div style="text-align: left;width: 297mm;font-size: 8px;">Kuning : Nahkoda </div><div style="text-align: right;width: 297mm;font-size: 8px;">Page <span style="margin-right: 1cm"><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      });

      await browser.close();
      return pdfBuffer;
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }
}
