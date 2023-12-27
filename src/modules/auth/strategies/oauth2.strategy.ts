import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://hcis-dev3.kallagroup.co.id/oauth/authorize',
      tokenURL: 'https://hcis-dev3.kallagroup.co.id/oauth/token',
      clientID: configService.get<string>('ESS_CLIENT_ID'),
      clientSecret: configService.get<string>('ESS_CLIENT_SECRET'),
      callbackUrl: configService.get<string>('ESS_CALLBACK_URL'),
      passReqToCallback: false,
      scope: ['user'],
    });
  }

  async validate(accessToken: string, refreshToken: string, user: any, done: any) {
    const userData = {
      accessToken,
      refreshToken,
      user,
    };

    done(null, userData);
  }
}
