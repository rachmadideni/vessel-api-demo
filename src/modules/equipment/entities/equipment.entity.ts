import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent, UpdateDateColumn } from 'typeorm';
import { Ship } from '../../ship/entities/ship.entity';
import { Room } from '../../room/entities/room.entity';

@Entity({
  name: 'equipments',
})
@Tree('materialized-path')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Column()
  name: string;

  @Column()
  brand: string;

  @Column()
  type: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  spesification: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Ship, (ship) => ship.id)
  ship: Ship;

  @ManyToOne(() => Room, (room) => room.id)
  room: Room;

  @TreeChildren()
  children: Equipment[];

  @TreeParent()
  parent: Equipment;
}
