import { AuthGuard } from '@nestjs/passport';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';

@Injectable()
export class DatabaseAccessGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector, private userService: UsersService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthorized = await super.canActivate(context);
    const request = context.switchToHttp().getRequest();
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role.find((x) => x.name === 'Superadmin')) return true;

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    const requiredPermissions = this.reflector.get<string>('permission', context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required, allow access
    }

    const userPermissions = await this.userService.findUserPermission(userId);

    //create looping to find menu async
    const isAllowed = async (userPermissions, requiredPermissions) => {
      for (const permission of userPermissions) {
        for (const menu of permission.menu) {
          for (const action of menu.actions) {
            if (requiredPermissions.includes(`${action.toLowerCase()}:${menu.name.toLowerCase()}`)) {
              return true;
            }
          }
        }
      }
      throw new ForbiddenException('You do not have permission to access this resource');
    };
    return await isAllowed(userPermissions.permissions, requiredPermissions);
  }
}
