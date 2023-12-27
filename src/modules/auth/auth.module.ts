import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { UsersModule } from '../users/users.module';
import { AzureAdOAuth2Strategy } from './strategies/microsoft.strategy';
import { Oauth2Strategy } from './strategies/oauth2.strategy';

@Module({
  imports: [JwtModule.register({}), UsersModule, HttpModule],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy, AzureAdOAuth2Strategy, Oauth2Strategy],
  exports: [AzureAdOAuth2Strategy],
})
export class AuthModule {}
