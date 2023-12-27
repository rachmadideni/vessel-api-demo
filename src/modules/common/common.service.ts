import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sections } from './entities/sections.entity';
import { CommonRepairmentReasons } from './entities/repairment-reasons.entity';

@Injectable()
export class CommonService {
  constructor(@InjectRepository(Sections) private sectionRepo: Repository<Sections>, @InjectRepository(CommonRepairmentReasons) private commonReasonRepo: Repository<CommonRepairmentReasons>) {}

  async getSections(): Promise<Sections[]> {
    return await this.sectionRepo.find();
  }

  async createSection(name: string): Promise<Sections> {
    return await this.sectionRepo.save({ name });
  }

  async updateSection(id: string, name: string) {
    const result = await this.sectionRepo.update(id, { name });
    if (result.affected === 0) {
      throw new HttpException('Section is not updated', HttpStatus.NOT_MODIFIED);
    }

    return await this.sectionRepo.findOne({
      where: {
        id,
      },
    });
  }

  async getRepairmentReasons(): Promise<CommonRepairmentReasons[]> {
    return await this.commonReasonRepo.find();
  }

  async createRepairmentReasons(name: string): Promise<CommonRepairmentReasons> {
    return await this.commonReasonRepo.save({ name });
  }

  async updateRepairmentReasons(id: number, name: string) {
    const result = await this.commonReasonRepo.update({ id }, { name });
    if (result.affected === 0) throw new HttpException('Repairment reason is not updated', HttpStatus.NOT_MODIFIED);
    else
      return await this.commonReasonRepo.findOne({
        where: {
          id,
        },
      });
  }

  async deleteRepairmentReasons(id: number) {
    const result = await this.commonReasonRepo.delete({ id });
    if (result.affected === 0) throw new HttpException('Repairment reason is not deleted', HttpStatus.NOT_MODIFIED);
    else return await this.commonReasonRepo.find();
  }
}
