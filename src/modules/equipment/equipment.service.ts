import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipment } from './entities/equipment.entity';
import { DataSource, Repository } from 'typeorm';
import { Room } from '../room/entities/room.entity';
import { Ship } from '../ship/entities/ship.entity';
import { ShipService } from '../ship/ship.service';
import { RoomService } from '../room/room.service';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentModel: Repository<Equipment>,
    private shipService: ShipService,
    private roomService: RoomService,
    private dataSource: DataSource
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    const equipment = new Equipment();
    equipment.name = createEquipmentDto.name;
    equipment.brand = createEquipmentDto.brand;
    equipment.type = createEquipmentDto.type;
    equipment.spesification = createEquipmentDto.spesification;

    const checkData = await this.checkData(createEquipmentDto.roomId, createEquipmentDto.shipId, createEquipmentDto.parentId);
    equipment.room = checkData.findRoom;
    equipment.ship = checkData.findShip;
    if (Object.keys(checkData.findParent).length > 0) {
      equipment.parent = checkData.findParent;
    }

    return await this.dataSource.manager.save(equipment);
  }

  async findAll(): Promise<Equipment[]> {
    return this.dataSource.getTreeRepository(Equipment).findTrees();
  }

  async findOne(id: string): Promise<Equipment> {
    const findOne = await this.dataSource.getRepository(Equipment).findOne({
      where: {
        id,
      },
      relations: ['children', 'room', 'ship'],
    });
    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Not Found');
  }

  async findOneById(id: string): Promise<Equipment> {
    const findOne = await this.equipmentModel.findOneBy({ id });
    return findOne;
  }

  async update(id: string, UpdateEquipmentDto: UpdateEquipmentDto) {
    const equipment = new Equipment();
    equipment.name = UpdateEquipmentDto.name;
    equipment.brand = UpdateEquipmentDto.brand;
    equipment.type = UpdateEquipmentDto.type;
    equipment.spesification = UpdateEquipmentDto.spesification;

    const checkData = await this.checkData(UpdateEquipmentDto.roomId, UpdateEquipmentDto.shipId, UpdateEquipmentDto.parentId);
    equipment.room = checkData.findRoom;
    equipment.ship = checkData.findShip;
    if (Object.keys(checkData.findParent).length > 0) {
      equipment.parent = checkData.findParent;
    }

    const findOne = await this.equipmentModel.findOneBy({ id });
    if (findOne) {
      return this.equipmentModel.save({
        ...findOne,
        ...equipment,
      });
    }
    throw new NotFoundException('Not Found');
  }

  async remove(id: string) {
    const findOne = await this.equipmentModel.findOneBy({ id });
    if (findOne) {
      return this.equipmentModel.softDelete(id);
    }
    throw new NotFoundException('Not Found');
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<Equipment>> {
    const findAll = await this.dataSource
      .getRepository(Equipment)
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.parent', 'parent')
      .leftJoinAndSelect('equipment.room', 'room')
      .leftJoinAndSelect('equipment.ship', 'ship')
      .orderBy('equipment.createdAt', 'DESC');

    return paginate<Equipment>(findAll, options);
  }

  async checkData(roomId, shipId, parentId) {
    let findRoom = new Room();
    let findShip = new Ship();
    let findParent = new Equipment();

    if (roomId) {
      findRoom = await this.roomService.findOneById(roomId);
      if (!findRoom) {
        throw new NotFoundException('Room not found');
      }
    }

    if (shipId) {
      findShip = await this.shipService.findOne(shipId);
      if (!findShip) {
        throw new NotFoundException('Ship not found');
      }
    }

    if (parentId) {
      findParent = await this.equipmentModel.findOneBy({ id: parentId });
      if (!findParent) {
        throw new NotFoundException('Parent not found');
      }
    }

    return {
      findRoom,
      findShip,
      findParent,
    };
  }
}
