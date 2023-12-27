import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { InjectModel } from '@nestjs/sequelize';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { JobService } from '../job/job.service';
import { Job } from '../job/entities/job.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from 'typeorm';
import { TaskFilterDto } from './dto/task-filter.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task)
    private taskModel: Repository<Task>,
    private jobService: JobService,
    @InjectRepository(Task) private taskRepo: Repository<Task>
  ) {}
  async create(createTaskDto: CreateTaskDto) {
    const findJob = await this.jobService.findOne(createTaskDto.jobId);

    const task = new Task();
    task.name = createTaskDto.name;
    task.job = findJob;

    return await this.taskModel.save(task);
  }

  async findAll(): Promise<Task[]> {
    return await this.taskModel.find();
  }

  async findOne(id: string): Promise<Task> {
    const findOne = await this.taskModel.findOne({
      where: { id },
      relations: ['job'],
    });
    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Not found task');
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const task = new Task();
    task.name = updateTaskDto.name;

    const findOne = await this.findOne(id);
    let checkJob = new Job();
    if (updateTaskDto.jobId) {
      checkJob = await this.jobService.findOne(updateTaskDto.jobId);
      task.job = checkJob;
    }

    return this.taskModel.save({
      ...findOne,
      ...task,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.taskModel.softDelete(id);
  }

  async paginate(options: IPaginationOptions, request: TaskFilterDto): Promise<Pagination<Task>> {
    const query = await this.taskModel.createQueryBuilder('task').leftJoinAndSelect('task.job', 'job');
    query.orderBy('task.createdAt', 'DESC');

    if (request.jobName) {
      query.andWhere('job.name LIKE :jobName', { jobName: `%${request.jobName}%` });
    }

    return paginate<Task>(query, options);
  }

  // async searchTask(query: string) {
  //   return await this.taskRepo.find({
  //     where: {
  //       name: Like(`%${query}%`),
  //     },
  //   });
  // }

  // async searchTaskByJobName(jobName: string) {
  //   return await this.taskRepo.find({
  //     relations: ['job'],
  //     where: {
  //       job: {
  //         name: Like(`%${jobName}%`),
  //       },
  //     },
  //   });
  // }
}
