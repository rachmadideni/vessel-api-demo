import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { MenuPermission } from '../menu/entities/menu-permission.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role, MenuPermission]), UsersModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
