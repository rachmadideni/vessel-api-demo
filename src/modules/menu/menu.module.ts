import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { MenuPermission } from './entities/menu-permission.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, MenuPermission]), UsersModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
