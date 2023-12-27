import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Job } from './entities/job.entity';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('job')
@ApiTags('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:jobs')
  @ApiBearerAuth()
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobService.create(createJobDto);
  }

  @Get()
  @ApiPagination({
    model: CreateJobDto,
    description: 'List of jobs',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:jobs')
  @ApiBearerAuth()
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<Job>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return await this.jobService.paginate(options);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:jobs')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:jobs')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobService.update(id, updateJobDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:jobs')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.jobService.remove(id);
  }
}
