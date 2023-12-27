import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Part } from './entities/part.entity';
import { PartUnit } from './entities/part-unit.entity';
import { DataSource, Repository, Like } from 'typeorm';
import { ShipService } from '../ship/ship.service';
import { EquipmentService } from '../equipment/equipment.service';
import { Ship } from '../ship/entities/ship.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { CreatePartUnitDto } from './dto/create-part-unit.dto';
import { UpdatePartUnitDto } from './dto/update-part-unit.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PartService {
  constructor(
    @InjectModel(Part)
    private partModel: Repository<Part>,
    @InjectRepository(Part) private partRepo: Repository<Part>,
    @InjectRepository(PartUnit) private partUnitRepo: Repository<PartUnit>,
    private shipService: ShipService,
    private equipmentService: EquipmentService,
    private dataSource: DataSource
  ) {}

  async create(createPartDto: CreatePartDto): Promise<Part> {
    const partUnit = await this.partUnitRepo.findOne({ where: { id: createPartDto.partUnit } });
    if (!partUnit) throw new NotFoundException('Part Unit not found');

    const part = new Part();
    part.number = createPartDto.number;
    part.description = createPartDto.description;
    part.type = createPartDto.type;
    part.grade = createPartDto.grade;
    part.specification = createPartDto.specification;
    part.category = createPartDto.category;
    part.partUnit = partUnit;
    part.comment = createPartDto.comment;

    const checkData = await this.checkData(createPartDto.shipId, createPartDto.EquipmentId);
    part.ship = checkData.findShip;
    part.equipment = checkData.findEquipment;

    return this.dataSource.manager.save(part);
  }

  async findOne(id: string): Promise<Part> {
    const findOne = await this.dataSource.getRepository(Part).findOne({
      where: {
        id,
      },
      relations: ['ship', 'equipment', 'partUnit'],
    });
    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Not Found');
  }

  async findOneById(id: string): Promise<Part> {
    const findOne = await this.partModel.findOneBy({ id });
    return findOne;
  }

  async update(id: string, updatePartDto: UpdatePartDto) {
    const partUnit = await this.partUnitRepo.findOne({ where: { id: updatePartDto.partUnit } });
    if (!partUnit) throw new NotFoundException('Part Unit not found');

    const part = new Part();
    part.number = updatePartDto.number;
    part.description = updatePartDto.description;
    part.type = updatePartDto.type;
    part.grade = updatePartDto.grade;
    part.specification = updatePartDto.specification;
    part.category = updatePartDto.category;
    part.partUnit = partUnit;
    part.comment = updatePartDto.comment;

    const checkData = await this.checkData(updatePartDto.shipId, updatePartDto.EquipmentId);
    part.ship = checkData.findShip;
    part.equipment = checkData.findEquipment;

    const findOne = await this.partModel.findOneBy({ id });
    if (findOne) {
      return this.partModel.save({
        ...findOne,
        ...part,
      });
    }
    throw new NotFoundException('Not Found');
  }

  async remove(id: string) {
    const findOne = await this.partModel.findOneBy({ id });
    if (findOne) {
      return this.partModel.softDelete(id);
    }
    throw new NotFoundException('Not Found');
  }

  async paginate(options: IPaginationOptions, users: any): Promise<Pagination<Part>> {
    const hasRoleSuperAdmin = await users[0].role.some((item) => item.name === 'Superadmin');
    const shipId = await users[1]?.shipId;

    const findAll = await this.dataSource
      .getRepository(Part)
      .createQueryBuilder('part')
      .leftJoinAndSelect('part.ship', 'ship')
      .leftJoinAndSelect('part.equipment', 'equipment')
      .leftJoinAndSelect('part.partUnit', 'unit')
      .orderBy('part.createdAt', 'DESC');

    if (!hasRoleSuperAdmin) {
      findAll.andWhere('part.shipId = :shipId', { shipId });
    }

    return paginate<Part>(findAll, options);
  }

  async checkData(shipId, equipmentId) {
    let findShip = new Ship();
    let findEquipment = new Equipment();

    if (shipId) {
      findShip = await this.shipService.findOne(shipId);
      if (!findShip) {
        throw new NotFoundException('Ship not found');
      }
    }

    if (equipmentId) {
      findEquipment = await this.equipmentService.findOneById(equipmentId);
      if (!findEquipment) {
        throw new NotFoundException('Equipment not found');
      }
    }

    return {
      findShip,
      findEquipment,
    };
  }

  async createPartUnit(createPartUnit: CreatePartUnitDto) {
    const partUnit = new PartUnit();
    partUnit.name = createPartUnit.name;
    return this.dataSource.manager.save(partUnit);
  }

  async updatePartUnit(id: string, updatePartUnit: UpdatePartUnitDto) {
    const results = await this.partUnitRepo.update(id, updatePartUnit);
    if (results.affected === 1) {
      return this.partUnitRepo.findOne({
        where: {
          id: id,
        },
      });
    }
  }

  async getPartUnit() {
    try {
      const partUnit = await this.partUnitRepo.find();
      return partUnit;
    } catch (err) {
      console.log(err);
    }
  }

  async searchPart(q: string) {
    try {
      console.log(q);
      const results = await this.partRepo.find({
        where: {
          description: Like(`%${q}%`),
        },
      });
      return results;
    } catch (err) {}
  }
}
