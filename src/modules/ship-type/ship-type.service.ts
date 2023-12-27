import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShipTypeDto } from './dto/create-ship-type.dto';
import { UpdateShipTypeDto } from './dto/update-ship-type.dto';
import { ShipType } from './entities/ship-type.entity';
import { InjectModel } from '@nestjs/sequelize';
import { Repository } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class ShipTypeService {
  constructor(@InjectModel(ShipType) private typeModel: Repository<ShipType>) {}

  async create(createTypeDto: CreateShipTypeDto): Promise<ShipType> {
    return this.typeModel.save(createTypeDto);
  }

  async findAll(): Promise<ShipType[]> {
    const findAll = await this.typeModel.find();
    if (findAll.length > 0) {
      return findAll;
    }
    throw new NotFoundException('Data is empty');
  }

  async findOne(id: string): Promise<ShipType> {
    const findOne = await this.typeModel.findOneBy({ id });

    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Ship Type Not Found');
  }

  async update(id: string, updateTypeDto: UpdateShipTypeDto) {
    const findOne = await this.typeModel.findOneBy({ id });
    if (findOne) {
      return this.typeModel.save({
        ...findOne,
        ...updateTypeDto,
      });
    }

    throw new NotFoundException('Ship Type Not Found');
  }

  async remove(id: string) {
    const findOne = await this.typeModel.findOneBy({ id });
    if (findOne) {
      return this.typeModel.softDelete(id);
    }
    throw new NotFoundException('Ship Type Not Found');
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<ShipType>> {
    const query = await this.typeModel.createQueryBuilder('shipType');
    query.orderBy('shipType.createdAt', 'DESC');

    return paginate<ShipType>(query, options);
  }
}
