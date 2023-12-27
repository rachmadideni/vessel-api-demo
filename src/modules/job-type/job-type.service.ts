import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobTypeDto } from './dto/create-job-type.dto';
import { UpdateJobTypeDto } from './dto/update-job-type.dto';
import { InjectModel } from '@nestjs/sequelize';
import { JobType } from './entities/job-type.entity';
import { DataSource, Repository } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class JobTypeService {
  constructor(
    @InjectModel(JobType)
    private jobTypesModel: Repository<JobType>,
    private dataSource: DataSource
  ) {}

  async create(createJobTypeDto: CreateJobTypeDto): Promise<JobType> {
    return this.jobTypesModel.save(createJobTypeDto);
  }

  async findAll(): Promise<JobType[]> {
    const findAll = await this.jobTypesModel.find();
    if (findAll.length > 0) {
      return findAll;
    }

    throw new NotFoundException('Data is empty');
  }

  async findOne(id: string): Promise<JobType> {
    const findOne = await this.jobTypesModel.findOneBy({ id });
    if (findOne) {
      return findOne;
    }
    throw new NotFoundException('Not Found job type');
  }

  async update(id: string, updateJobTypeDto: UpdateJobTypeDto): Promise<JobType> {
    const findOne = await this.jobTypesModel.findOneBy({ id });
    if (findOne) {
      return this.jobTypesModel.save({
        ...findOne,
        ...updateJobTypeDto,
      });
    }

    throw new NotFoundException('Not found job type');
  }

  async remove(id: string) {
    const findOne = await this.jobTypesModel.findOneBy({ id });
    if (findOne) {
      return this.jobTypesModel.softDelete({ id });
    }

    throw new NotFoundException('Not Found job type');
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<JobType>> {
    const findAll = await this.dataSource.getRepository(JobType).createQueryBuilder('jobtype').orderBy('jobtype.createdAt', 'DESC');

    return paginate<JobType>(findAll, options);
  }
}
