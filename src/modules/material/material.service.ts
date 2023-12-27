import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Material } from './entities/material.entity';
import { DataSource, Repository } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(Material)
    private materialModel: Repository<Material>,
    private dataSource: DataSource
  ) {}
  async create(createMaterialDto: CreateMaterialDto) {
    return this.materialModel.save(createMaterialDto);
  }

  async findAll(): Promise<Material[]> {
    const findAll = await this.materialModel.find();
    if (findAll.length > 0) {
      return findAll;
    }
    throw new NotFoundException('Not Found');
  }

  async findOne(id: string): Promise<Material> {
    const findOne = await this.materialModel.findOneBy({ id });
    if (findOne) {
      return findOne;
    }
    throw new NotFoundException('Not Found');
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto) {
    const findOne = await this.materialModel.findOneBy({ id });
    if (findOne) {
      return this.materialModel.save({
        ...findOne,
        ...updateMaterialDto,
      });
    }
    throw new NotFoundException('Not Found');
  }

  async remove(id: string) {
    const findOne = await this.materialModel.findOneBy({ id });
    if (findOne) {
      return this.materialModel.softDelete(id);
    }
    throw new NotFoundException('Not Found');
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<Material>> {
    const findAll = await this.dataSource.getRepository(Material).createQueryBuilder('material').orderBy('material.createdAt', 'DESC');

    return paginate<Material>(findAll, options);
  }
}
