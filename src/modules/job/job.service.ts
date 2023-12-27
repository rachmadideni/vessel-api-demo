import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from './entities/job.entity';
import { DataSource, Repository } from 'typeorm';
import { JobTypeService } from '../job-type/job-type.service';
import { JobType } from '../job-type/entities/job-type.entity';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job)
    private jobModel: Repository<Job>,
    private jobTypeService: JobTypeService,
    private dataSource: DataSource
  ) {}

  async create(createJobDto: CreateJobDto): Promise<Job> {
    const findJobType = await this.jobTypeService.findOne(createJobDto.jobTypeId);

    const job = new Job();
    job.name = createJobDto.name;
    job.jobType = findJobType;

    return await this.jobModel.save(job);
  }

  async findAll(): Promise<Job[]> {
    return await this.jobModel.find();
  }

  async findOne(id: string): Promise<Job> {
    const findOne = await this.jobModel.findOne({
      where: { id },
      relations: ['jobType'],
    });
    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Not found job');
  }

  async update(id: string, updateJobDto: UpdateJobDto) {
    const job = new Job();
    job.name = updateJobDto.name;

    const findOne = await this.findOne(id);
    let checkJob = new JobType();
    if (updateJobDto.jobTypeId) {
      checkJob = await this.jobTypeService.findOne(updateJobDto.jobTypeId);
      job.jobType = checkJob;
    }

    return this.jobModel.save({
      ...findOne,
      ...job,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.jobModel.softDelete(id);
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<Job>> {
    const findAll = await this.dataSource.getRepository(Job).createQueryBuilder('job').leftJoinAndSelect('job.jobType', 'jobType').orderBy('job.createdAt', 'DESC');

    return paginate<Job>(findAll, options);
  }
}
