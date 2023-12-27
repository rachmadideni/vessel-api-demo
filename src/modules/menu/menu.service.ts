import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Menu } from './entities/menu.entity';
import { Repository } from 'typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { MenuPermission } from './entities/menu-permission.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu)
    private menuModel: Repository<Menu>,
    @InjectModel(MenuPermission)
    private menuPermissionModel: Repository<MenuPermission>
  ) {}

  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    const findMenu = await this.menuModel.findOneBy({ name: createMenuDto.name });
    if (findMenu) {
      throw new HttpException('Menu already exist', 409);
    }

    const queryRunner = this.menuModel.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const insert = await this.menuModel.save(createMenuDto);
      if (createMenuDto.menuPermissions) {
        for (let i = 0; i < createMenuDto.menuPermissions.length; i++) {
          await this.menuPermissionModel.save({
            name: createMenuDto.menuPermissions[i],
            menu: insert,
          });
        }
      }
      await queryRunner.commitTransaction();
      return insert;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, 500);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Menu[]> {
    return await this.menuModel.find({
      select: {
        permissions: {
          id: true,
          name: true,
        },
      },
      relations: ['permissions'],
      order: {
        groupOrderNo: 'ASC',
        groupMenuNo: 'ASC',
        permissions: {
          name: 'DESC',
        },
      },
    });
  }

  async findOne(id: string): Promise<Menu> {
    const findOne = await this.menuModel.findOne({
      where: { id },
      relations: ['permissions'],
      select: {
        permissions: {
          id: true,
          name: true,
        },
      },
    });

    if (findOne) {
      return findOne;
    }

    throw new NotFoundException('Menu not found');
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const findOne = await this.menuModel.findOneBy({ id });

    if (findOne) {
      //create transaction query
      const queryRunner = this.menuModel.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const update = this.menuModel.save({
          ...findOne,
          ...updateMenuDto,
        });

        if (updateMenuDto.menuPermissions) {
          const menu = new Menu();
          menu.id = id;
          for (const permission of updateMenuDto.menuPermissions) {
            const findPermission = await this.menuPermissionModel.findOne({
              where: {
                menu: menu,
                name: permission,
              },
            });
            if (!findPermission) {
              await this.menuPermissionModel.save({
                name: permission,
                menu: findOne,
              });
            }
          }
        }

        await queryRunner.commitTransaction();
        return update;
      } catch (error) {
        throw new HttpException(error.message, error.status || 500);
      } finally {
        await queryRunner.release();
      }
    }

    throw new NotFoundException('Menu not found');
  }

  async remove(id: string) {
    const findOne = await this.menuModel.findOneBy({ id });

    if (findOne) {
      return this.menuModel.softDelete(id);
    }

    throw new NotFoundException('Menu not found');
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<Menu>> {
    const query = await this.menuModel.createQueryBuilder('menu');
    query.orderBy('menu.createdAt', 'DESC');

    return paginate<Menu>(query, options);
  }

  async removePermission(id: string, permissionId: string) {
    const [menu, permission] = await Promise.all([await this.menuModel.findOneBy({ id }), await this.menuPermissionModel.findOneBy({ id: permissionId })]);
    if (!menu) throw new NotFoundException('Menu not found');
    if (!permission) throw new NotFoundException('Permission not found');

    return this.menuPermissionModel.softDelete(permissionId);
  }
}
