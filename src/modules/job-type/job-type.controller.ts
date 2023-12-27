import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JobTypeService } from './job-type.service';
import { CreateJobTypeDto } from './dto/create-job-type.dto';
import { UpdateJobTypeDto } from './dto/update-job-type.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPagination } from '../../common/decorator/api-pagination.decorator';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { JobType } from './entities/job-type.entity';
import { DatabaseAccessGuard } from '../auth/guards/databaseAccess.guard';
import { Permission } from '../../common/decorator/Permissions.decorator';

@Controller('job-type')
@ApiTags('job type')
export class JobTypeController {
  constructor(private readonly jobTypeService: JobTypeService) {}

  @Post()
  @UseGuards(DatabaseAccessGuard)
  @Permission('create:job types')
  @ApiBearerAuth()
  create(@Body() createJobTypeDto: CreateJobTypeDto) {
    return this.jobTypeService.create(createJobTypeDto);
  }

  @Get()
  @ApiPagination({
    model: CreateJobTypeDto,
    description: 'List of job types',
  })
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:job types')
  @ApiBearerAuth()
  async findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<Pagination<JobType>> {
    const options: IPaginationOptions = {
      limit,
      page,
    };
    return await this.jobTypeService.paginate(options);
  }

  @Get(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('read:job types')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.jobTypeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('update:job types')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateJobTypeDto: UpdateJobTypeDto) {
    return this.jobTypeService.update(id, updateJobTypeDto);
  }

  @Delete(':id')
  @UseGuards(DatabaseAccessGuard)
  @Permission('delete:job types')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.jobTypeService.remove(id);
  }
}
