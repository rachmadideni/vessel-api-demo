import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto, SignUpDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import * as argon2 from 'argon2';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';
import { MenuGroup, ModifiedJSON } from './interface/transform-permission.interface';
import { Ship } from '../ship/entities/ship.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: Repository<User>, @InjectModel(Role) private roleModel: Repository<Role>, private dataSource: DataSource) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = new User();
      user.email = createUserDto.email.trim().toLowerCase();
      user.firstName = createUserDto.firstName;
      user.lastName = createUserDto.lastName;

      user.password = await argon2.hash(createUserDto.password);

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        if (createUserDto.shipId) {
          const findShip = await this.dataSource.getRepository(Ship).findOne({
            where: { id: createUserDto.shipId },
            select: {
              id: true,
              name: true,
            },
          });
          if (!findShip) throw new HttpException('Ship not found', HttpStatus.NOT_FOUND);
          user.ship = findShip;
        }
        const userData = await this.userModel.save(user);

        if (createUserDto.userRoles) {
          for (const permission of createUserDto.userRoles) {
            const role = await this.roleModel.findOne({ where: { id: permission } });
            if (!role) throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
            await this.dataSource.createQueryBuilder().insert().into('user_roles').values({ userId: userData.id, roleId: permission }).execute();
          }
        }

        await queryRunner.commitTransaction();
        return {
          ...userData,
          userPermissions: createUserDto.userRoles,
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new HttpException(error.message, error.status || 500);
      } finally {
        await queryRunner.release();
      }
    } catch (err) {
      if (err?.original?.constraint === 'user_email_key') {
        throw new HttpException(`User with email '${err.errors[0].value}' already exists`, HttpStatus.CONFLICT);
      }

      throw new HttpException(err.message, err.status || 500);
    }
  }

  async createSignUp(createUserDto: SignUpDto) {
    try {
      const user = new User();
      user.email = createUserDto.email.trim().toLowerCase();
      user.firstName = createUserDto.firstName;
      user.lastName = createUserDto.lastName;

      user.password = await argon2.hash(createUserDto.password);

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const userData = await this.userModel.save(user);

        await queryRunner.commitTransaction();
        return userData;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new HttpException(error.message, error.status || 500);
      } finally {
        await queryRunner.release();
      }
    } catch (err) {
      if (err?.original?.constraint === 'user_email_key') {
        throw new HttpException(`User with email '${err.errors[0].value}' already exists`, HttpStatus.CONFLICT);
      }

      throw new HttpException(err.message, err.status || 500);
    }
  }

  async createRoleUser(userId: string, roleId: string) {
    const [user, role] = await Promise.all([this.userModel.findOne({ where: { id: userId } }), this.roleModel.findOne({ where: { id: roleId } })]);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!role) throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
  }

  async findAll(): Promise<User[]> {
    const allUsers = await this.userModel.find({
      relations: ['roles', 'ship'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          id: true,
          name: true,
        },
        ship: {
          id: true,
          name: true,
        },
      },
    });
    if (allUsers.length > 0) {
      return allUsers;
    }

    throw new HttpException('User is empty', HttpStatus.NOT_FOUND);
  }

  async findOne(id: string): Promise<User> {
    const findUser = await this.userModel.findOne({
      relations: ['roles', 'ship'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        title: true,
        refreshToken: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          id: true,
          name: true,
        },
        ship: {
          id: true,
          name: true,
        },
      },
      where: {
        id,
      },
    });

    if (findUser) {
      return findUser;
    }

    throw new HttpException(`Not Found With id ${id}`, HttpStatus.NOT_FOUND);
  }

  async findUsername(username: string): Promise<User> {
    return await this.userModel.findOne({
      where: { email: username },
      relations: ['roles', 'ship'],
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        title: true,
        roles: {
          id: true,
          name: true,
        },
        ship: {
          id: true,
          name: true,
        },
      },
    });
  }

  async findUserPermission(id: string) {
    const findPermission = await this.userModel.findOne({
      relations: ['roles'],
      select: {
        roles: {
          id: true,
          name: true,
        },
      },
      where: {
        id,
      },
    });

    if (!findPermission) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const rolePermissions = [];
    for (const roles of findPermission.roles) {
      rolePermissions.push(roles.id);
    }

    let findRolePermission: any[] = [];
    if (rolePermissions.length > 0) {
      findRolePermission = await this.roleModel.find({
        relations: ['permission', 'permission.menu'],
        where: {
          id: In([rolePermissions]),
        },
        order: {
          permission: {
            menu: {
              name: 'ASC',
            },
          },
        },
      });
    }

    // return findRolePermission;
    return this.modifyJSON(findRolePermission);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const findData = await this.userModel.findOneBy({ id });
    if (!findData) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (updateUserDto.userRoles) {
      for (const permission of updateUserDto.userRoles) {
        const [role, findUserRole] = await Promise.all([
          this.roleModel.findOne({ where: { id: permission } }),
          this.dataSource.query(`SELECT * FROM user_roles WHERE userId = '${id}' AND roleId = '${permission}'`),
        ]);
        const resultArrayUserRole = findUserRole.valueOf() as any[];
        if (!role) throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
        if (resultArrayUserRole.length == 0) {
          await this.dataSource.createQueryBuilder().insert().into('user_roles').values({ userId: id, roleId: permission }).execute();
        }
      }
    }
    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }
    const user = new User();
    if (updateUserDto.shipId) {
      const findShip = await this.dataSource.getRepository(Ship).findOne({
        where: { id: updateUserDto.shipId },
        select: {
          id: true,
          name: true,
        },
      });
      if (!findShip) throw new HttpException('Ship not found', HttpStatus.NOT_FOUND);
      user.ship = findShip;
    }

    return await this.userModel.save({
      ...findData,
      ...updateUserDto,
      ...user,
    });
  }

  async remove(id: string) {
    return this.userModel.softDelete(id);
  }

  async removeUserRole(id: string, roleId: string) {
    const findRolePermission = await this.dataSource.query(`SELECT * FROM user_roles WHERE userId = '${id}' AND roleId = '${roleId}'`);

    const resultArrayRolePermission = findRolePermission.valueOf() as any[];
    if (resultArrayRolePermission.length === 0) throw new HttpException('User role not found', HttpStatus.NOT_FOUND);

    return this.dataSource.query(`DELETE FROM user_roles WHERE userId = '${id}' AND roleId = '${roleId}'`);
  }

  async paginate(options: IPaginationOptions): Promise<Pagination<User>> {
    const query = await this.userModel.createQueryBuilder('user').leftJoinAndSelect('user.roles', 'roles').leftJoin('user.ship', 'ship').addSelect(['ship.id', 'ship.name']);
    query.orderBy('user.createdAt', 'DESC');

    return paginate<User>(query, options);
  }

  modifyJSON(originalJSON: any[]): ModifiedJSON {
    const modifiedJSON: ModifiedJSON = {
      permissions: [],
    };

    const groupMenuMap: Map<string, MenuGroup> = new Map();

    originalJSON.forEach((role) => {
      role.permission.forEach((permission) => {
        const groupMenu = permission.menu.groupMenu;
        const menuName = permission.menu.name;
        const actionName = permission.name;

        let menuGroup: MenuGroup | undefined = groupMenuMap.get(groupMenu);
        if (!menuGroup) {
          menuGroup = {
            groupMenu,
            menu: [],
          };
          groupMenuMap.set(groupMenu, menuGroup);
          modifiedJSON.permissions.push(menuGroup);
        }

        let menuAction = menuGroup.menu.find((menu) => menu.name === menuName);
        if (!menuAction) {
          menuAction = {
            name: menuName,
            actions: [],
          };
          menuGroup.menu.push(menuAction);
        }
        //check action name exist
        if (menuAction.actions.includes(actionName)) return;
        menuAction.actions.push(actionName);
      });
    });

    return modifiedJSON;
  }

  async findAllRoles() {
    const users = await this.userModel.find({
      relations: ['roles'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        roles: {
          id: true,
          name: true,
        },
      },
    });

    const userRoles = [];
    for (const user of users) {
      userRoles.push({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles.map((role) => ({
          id: role.id,
          name: role.name,
        })),
      });
    }
    return userRoles;
  }
}
