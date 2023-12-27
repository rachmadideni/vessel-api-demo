import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-azure-ad-oauth2';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AzureAdOAuth2Strategy extends PassportStrategy(Strategy, 'azure-ad-oauth2') {
  constructor() {
    super({
      clientID: process.env.AZURE_AD_APP_ID,
      clientSecret: '4n88Q~dkuMa.mfbArIdq0mwobCQZLJNdEw7_zcv7',
      callbackURL: process.env.AZURE_AD_REDIRECT_URI,
      resource: 'https://graph.microsoft.com/',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const user = {
      accessToken,
      refreshToken,
      profile,
    };
    done(null, user);
  }
}
