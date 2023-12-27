import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, SignUpDto } from '../users/dto/create-user.dto';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async signUp(createUserDto: SignUpDto): Promise<any> {
    const checkEmail = await this.usersService.findUsername(createUserDto.email);
    if (checkEmail) throw new BadRequestException('Email already exists');

    const newUser = await this.usersService.createSignUp(createUserDto);
    const token = await this.getToken(newUser.id, newUser.email, newUser?.roles, newUser?.ship?.id);
    await this.updateRefreshToken(newUser.id, token.refreshToken);
    return newUser;
  }

  async signIn(data: AuthDto) {
    const user = await this.usersService.findUsername(data.username);
    if (!user) throw new BadRequestException('User does not exist');
    const passwordMatch = await argon2.verify(user.password, data.password);
    if (!passwordMatch) throw new BadRequestException('Password is incorrect');
    const token = await this.getToken(user.id, user.email, user?.roles, user?.ship?.id);
    await this.updateRefreshToken(user.id, token.refreshToken);
    return token;
  }

  async SignInMicrosoft(username: string, firstName: string, lastName: string, password: string) {
    const createUserDTO = new CreateUserDto();
    createUserDTO.email = username;
    createUserDTO.firstName = firstName;
    createUserDTO.lastName = lastName;
    createUserDTO.password = password;

    const user = await this.usersService.findUsername(username);
    let id = user?.id;
    if (!user) {
      const newUser = await this.usersService.create(createUserDTO);
      id = newUser?.id;
    }
    const token = await this.getToken(id, username, user?.roles, user?.ship?.id);
    await this.updateRefreshToken(id, token.refreshToken);
    return token;
  }

  async logout(userId: string) {
    await this.usersService.update(userId, { refreshToken: null });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.refreshToken) throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await argon2.verify(user.refreshToken, refreshToken);

    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');
    const tokens = await this.getToken(user.id, user.email, user?.roles, user?.ship?.id);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  hashData(data: string) {
    return argon2.hash(data);
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getToken(userId: string, username: string, role: any[], shipId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
          role,
          shipId,
        },
        {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: '6d',
        }
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '6d',
        }
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async essSignIn(email: string, fullName: string) {
    const user = await this.usersService.findUsername(email);
    let id = user?.id;
    if (!user) {
      // extract full name to first name and last name
      fullName = fullName.toLowerCase();
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
      const lastName = nameParts.slice(1).join(' ');

      const createUserDTO = new CreateUserDto();
      createUserDTO.email = email;
      createUserDTO.firstName = firstName;
      createUserDTO.lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
      createUserDTO.password = '';

      const newUser = await this.usersService.create(createUserDTO);
      id = newUser?.id;
    }

    const token = await this.getToken(id, email, user?.roles, user?.ship?.id);
    // await this.updateRefreshToken(id, token.refreshToken);
    return token;
  }
}
