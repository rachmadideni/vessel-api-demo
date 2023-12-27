import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from '@nestjs/class-validator';

export class AuthDto {
  @ApiProperty()
  @IsEmail()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
