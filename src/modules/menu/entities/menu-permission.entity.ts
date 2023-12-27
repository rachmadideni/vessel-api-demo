import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Menu } from './menu.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity({
  name: 'menu_permissions',
})
export class MenuPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Menu, (menu) => menu.id)
  menu: Menu;

  @OneToMany(() => Role, (role) => role.permission)
  roles: Role;
}
