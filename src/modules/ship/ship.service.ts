import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShipDto } from './dto/create-ship.dto';
import { UpdateShipDto } from './dto/update-ship.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Ship } from './entities/ship.entity';
import { Repository } from 'typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { ShipTypeService } from '../ship-type/ship-type.service';
import { ShipType } from '../ship-type/entities/ship-type.entity';

@Injectable()
export class ShipService {
  constructor(
    @InjectModel(Ship)
    private shipModel: Repository<Ship>,
    private shipTypeService: ShipTypeService
  ) {}

  async create(createShipDto: CreateShipDto): Promise<Ship> {
    const ship = new Ship();
    let shipType = new ShipType();
    ship.name = createShipDto.name;
    ship.callSign = createShipDto.callSign;
    ship.imoNumber = createShipDto.imoNumber;
    ship.mmssiNumber = createShipDto.mmssiNumber;
    ship.yearBuild = createShipDto.yearBuild;
    ship.grossTonnage = createShipDto.grossTonnage;
    ship.deadWeightTonnage = createShipDto.deadWeightTonnage;
    ship.lengthOverAll = createShipDto.lengthOverAll;
    ship.propellerType = createShipDto.propellerType;
    ship.mainEngine = createShipDto.mainEngine;
    ship.auxEngine = createShipDto.auxEngine;
    ship.auxEngine2 = createShipDto.auxEngine2;
    ship.auxEngine3 = createShipDto.auxEngine3;

    if (createShipDto.shipTypeId) {
      shipType = await this.shipTypeService.findOne(createShipDto.shipTypeId);
      ship.shipType = shipType;
    }

    return this.shipModel.save(ship);
  }

  async findAll(): Promise<Ship[]> {
    const findAll = await this.shipModel.find({
      relations: {
        shipType: true,
      },
    });
    if (findAll.length > 0) {
      return findAll;
    }
    throw new NotFoundException('Data is empty');
  }

  async findOne(id: string): Promise<Ship> {
    const findOne = await this.shipModel.findOneBy({ id });

    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Ship Not Found');
  }

  async update(id: string, updateShipDto: UpdateShipDto) {
    const findOne = await this.shipModel.findOneBy({ id });
    if (findOne) {
      const ship = new Ship();
      let shipType = new ShipType();

      if (updateShipDto.shipTypeId) {
        shipType = await this.shipTypeService.findOne(updateShipDto.shipTypeId);
        ship.shipType = shipType;
      }

      return this.shipModel.save({
        ...findOne,
        ...updateShipDto,
        ...ship,
      });
    }

    throw new NotFoundException('Ship Not Found');
  }

  async remove(id: string) {
    const findOne = await this.shipModel.findOneBy({ id });
    if (findOne) {
      return this.shipModel.softDelete(id);
    }
    throw new NotFoundException('Ship Not Found');
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<Ship>> {
    const query = await this.shipModel.createQueryBuilder('ship').leftJoinAndSelect('ship.shipType', 'shipType');
    query.orderBy('ship.createdAt', 'DESC');

    return paginate<Ship>(query, options);
  }
}
