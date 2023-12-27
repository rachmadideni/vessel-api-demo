import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Task } from './entities/task.entity';
import { Permission } from '../../common/decorator/Permissions.decorator';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';

@Controller('task')
@ApiTags('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:tasks')
  @ApiBearerAuth()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  @ApiPagination({
    model: CreateTaskDto,
    description: 'List of task',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:tasks')
  @ApiBearerAuth()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('jobName') jobName?: string
  ): Promise<Pagination<Task>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };

    const filters = {
      jobName,
    };
    return await this.taskService.paginate(options, { ...filters });
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:tasks')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:tasks')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:tasks')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }

  // @Get('searchTaskByName/:query')
  // @UseGuards(DatabaseAccessGuard)
  // @Permission('read:tasks')
  // async searchTask(@Param('query') query: string) {
  //   return await this.taskService.searchTask(query);
  // }

  // @Get('searchTaskByJobName/:jobName')
  // @UseGuards(DatabaseAccessGuard)
  // @Permission('read:tasks')
  // @ApiBearerAuth()
  // async searchTaskByJobName(@Param('jobName') jobName: string) {
  //   return await this.taskService.searchTaskByJobName(jobName);
  // }
}
