import { Body, Controller, Get, Patch, Post, Param, HttpException, Delete } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateRepairmentReasonsDto } from './dto/create-repairment-reasons.dto';
import { UpdateRepairmentReasonsDto } from './dto/update-repairment-reasons.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Controller('common')
@ApiTags('Common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}
  @Get('sections')
  @ApiOperation({ summary: 'Get all sections' })
  async getSections() {
    return await this.commonService.getSections();
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create a section' })
  @ApiBody({ type: CreateSectionDto })
  async createSection(@Body('name') name: string) {
    return await this.commonService.createSection(name);
  }

  @Patch('sections/:id')
  @ApiOperation({ summary: 'Update a section' })
  @ApiBody({ type: UpdateSectionDto })
  async updateSection(@Param('id') id: string, @Body('name') name: string) {
    try {
      return await this.commonService.updateSection(id, name);
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.message, err.getStatus());
      }
    }
  }

  @Get('repairment-reasons')
  @ApiOperation({ summary: 'Get common repairment reasons' })
  async getRepairmentReasons() {
    return await this.commonService.getRepairmentReasons();
  }

  @Post('repairment-reasons')
  @ApiOperation({ summary: 'Create a common repairment reason' })
  @ApiBody({ type: CreateRepairmentReasonsDto })
  async createRepairmentReasons(@Body('name') name: string) {
    return await this.commonService.createRepairmentReasons(name);
  }

  @Patch('repairment-reasons/:id')
  @ApiOperation({ summary: 'Update a common repairment reason' })
  @ApiBody({ type: UpdateRepairmentReasonsDto })
  async updateRepairmentReasons(@Param('id') id: number, @Body('name') name: string) {
    return await this.commonService.updateRepairmentReasons(id, name);
  }

  @Delete('repairment-reasons/:id')
  @ApiOperation({ summary: 'Delete a common repairment reason' })
  async deleteRepairmentReasons(@Param('id') id: number) {
    return await this.commonService.deleteRepairmentReasons(id);
  }
}
