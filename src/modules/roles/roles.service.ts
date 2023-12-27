import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './entities/role.entity';
import { DataSource, Repository } from 'typeorm';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { MenuPermission } from '../menu/entities/menu-permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role)
    private roleModel: Repository<Role>,
    @InjectModel(MenuPermission)
    private menuPermissionModel: Repository<MenuPermission>,
    private dataSource: DataSource
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const findOne = await this.roleModel.findOneBy({ name: createRoleDto.name });

    if (findOne) {
      throw new HttpException('Role already exist', 409);
    }

    const queryRunner = this.roleModel.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const insert = await queryRunner.manager.save(Role, {
        name: createRoleDto.name,
        description: createRoleDto.description,
      });
      if (insert) {
        for (let i = 0; i < createRoleDto.rolePermissions.length; i++) {
          const findPermission = await this.menuPermissionModel.findOneBy({ id: createRoleDto.rolePermissions[i] });
          if (!findPermission) {
            throw new HttpException('Id Permission not found', HttpStatus.NOT_FOUND);
          }
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into('role_permissions')
            .values({
              roleId: insert,
              permissionId: createRoleDto.rolePermissions[i],
            })
            .execute();
        }
      }
      await queryRunner.commitTransaction();
      return {
        ...insert,
        rolePermissions: createRoleDto.rolePermissions,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status || 500);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Role[]> {
    const findAll = await this.roleModel.find({
      relations: ['permission', 'permission.menu'],
      select: {
        permission: {
          id: true,
          name: true,
          menu: {
            id: true,
            name: true,
          },
        },
      },
    });

    return findAll;
  }

  async findOne(id: string): Promise<Role> {
    const findOne = await this.roleModel.findOne({
      where: {
        id,
      },
      relations: ['permission', 'permission.menu'],
      select: {
        permission: {
          id: true,
          name: true,
          menu: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (findOne) {
      return findOne;
    }

    throw new HttpException('Role not found', 404);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const findOne = await this.roleModel.findOneBy({ id });
    if (findOne) {
      const queryRunner = this.roleModel.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        if (updateRoleDto.rolePermissions) {
          for (let i = 0; i < updateRoleDto.rolePermissions.length; i++) {
            const role = new Role();
            role.id = id;
            const permission = new MenuPermission();
            permission.id = updateRoleDto.rolePermissions[i];
            const [findPermission, findRolePermission] = await Promise.all([
              await this.menuPermissionModel.findOneBy({ id: updateRoleDto.rolePermissions[i] }),
              await this.dataSource.query(`SELECT * FROM role_permissions WHERE roleId = '${id}' AND permissionId = '${updateRoleDto.rolePermissions[i]}'`),
            ]);

            const resultArrayRolePermission = findRolePermission.valueOf() as any[];
            if (!findPermission) throw new HttpException('Id Permission not found', HttpStatus.NOT_FOUND);
            if (resultArrayRolePermission.length == 0) {
              await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into('role_permissions')
                .values({
                  roleId: id,
                  permissionId: updateRoleDto.rolePermissions[i],
                })
                .execute();
            }
          }
        }
        const update = this.roleModel.save({
          ...findOne,
          ...updateRoleDto,
        });

        await queryRunner.commitTransaction();
        return {
          ...update,
          rolePermissions: updateRoleDto.rolePermissions,
        };
      } catch (error) {
        throw new HttpException(error.message, error.status || 500);
      } finally {
        await queryRunner.release();
      }
    }
    throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
  }

  async remove(id: string) {
    const findOne = await this.roleModel.findOneBy({ id });
    if (findOne) {
      return this.roleModel.remove(findOne);
    }
    throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
  }

  async removeRolePermission(id: string, permissionId: string) {
    const findRolePermission = await this.dataSource.query(`SELECT * FROM role_permissions WHERE roleId = '${id}' AND permissionId = '${permissionId}'`);

    const resultArrayRolePermission = findRolePermission.valueOf() as any[];
    if (resultArrayRolePermission.length === 0) throw new HttpException('Role Permission not found', HttpStatus.NOT_FOUND);

    return this.dataSource.query(`DELETE FROM role_permissions WHERE roleId = '${id}' AND permissionId = '${permissionId}'`);
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<Role>> {
    const query = await this.roleModel.createQueryBuilder('role');
    query.orderBy('role.createdAt', 'DESC');

    return paginate<Role>(query, options);
  }
}
