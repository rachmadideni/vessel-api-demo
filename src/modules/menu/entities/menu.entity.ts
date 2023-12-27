import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MenuPermission } from './menu-permission.entity';

@Entity({
  name: 'menus',
})
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => MenuPermission, (permission) => permission.menu)
  permissions: MenuPermission[];

  @Column()
  name: string;

  @Column()
  identifier: string;

  @Column()
  groupMenu: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column()
  groupOrderNo: number;

  @Column()
  groupMenuNo: number;
}
