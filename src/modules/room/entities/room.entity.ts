import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Ship } from '../../ship/entities/ship.entity';

@Entity({
  name: 'rooms',
})
@Tree('materialized-path')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  @ApiProperty()
  id: string;

  @Column()
  @Index()
  @ApiProperty()
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  @ApiProperty()
  description: string;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date;

  @ApiProperty()
  @ManyToOne(() => Ship, (ship) => ship.id)
  ship: Ship;

  @TreeChildren()
  children: Room[];

  @TreeParent()
  parent: Room;
}
