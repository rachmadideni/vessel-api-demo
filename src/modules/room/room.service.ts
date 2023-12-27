import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { DataSource, Repository } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { InjectRepository } from '@nestjs/typeorm';
import { ShipService } from '../ship/ship.service';
import { Ship } from '../ship/entities/ship.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomModel: Repository<Room>,
    private shipService: ShipService,
    private dataSource: DataSource
  ) {}
  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = new Room();
    room.name = createRoomDto.name;
    room.description = createRoomDto.description;

    const checkData = await this.checkData(createRoomDto.parentId, createRoomDto.shipId);
    room.ship = checkData.findShip;
    if (Object.keys(checkData.findParent).length > 0) {
      room.parent = checkData.findParent;
    }

    return await this.dataSource.manager.save(room);
  }

  async findAll(): Promise<Room[]> {
    return this.dataSource.getTreeRepository(Room).findTrees();
  }

  async findOne(id: string): Promise<Room> {
    const findOne = await this.dataSource.getRepository(Room).findOne({
      where: {
        id,
      },
      relations: ['children'],
    });
    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Not Found');
  }

  async findOneById(id: string): Promise<Room> {
    const findOne = await this.roomModel.findOneBy({ id });
    return findOne;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    const room = new Room();
    room.name = updateRoomDto.name;
    room.description = updateRoomDto.description;

    const checkData = await this.checkData(updateRoomDto.parentId, updateRoomDto.shipId);
    room.ship = checkData.findShip;
    if (Object.keys(checkData.findParent).length > 0) {
      room.parent = checkData.findParent;
    }

    const findOne = await this.roomModel.findOneBy({ id });
    if (findOne) {
      return this.roomModel.save({
        ...findOne,
        ...room,
      });
    }
    throw new NotFoundException('Not Found');
  }

  async remove(id: string) {
    const findOne = await this.roomModel.findOneBy({ id });
    if (findOne) {
      return this.roomModel.softDelete(id);
    }
    throw new NotFoundException('Not Found');
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<Room>> {
    const findAll = await this.dataSource
      .getRepository(Room)
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.ship', 'ship')
      .leftJoinAndSelect('room.parent', 'parent')
      .orderBy('room.createdAt', 'DESC');

    return paginate<Room>(findAll, options);
  }

  async checkData(parentId, shipId) {
    let findParent = new Room();
    let findShip = new Ship();

    if (parentId) {
      findParent = await this.roomModel.findOneBy({ id: parentId });
      if (!findParent) {
        throw new NotFoundException('Parent not found');
      }
    }
    if (shipId) {
      findShip = await this.shipService.findOne(shipId);
      if (!findShip) {
        throw new NotFoundException('Ship not found');
      }
    }

    return {
      findParent,
      findShip,
    };
  }
}
