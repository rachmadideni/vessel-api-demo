import { IsEmail, IsNotEmpty } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  refreshToken: string;

  @ApiProperty()
  shipId: string;

  @ApiProperty({
    type: [String],
    example: ['1'],
  })
  userRoles: string[];
}

export class SignUpDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}
