import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import jwt_decode from 'jwt-decode';
import { ConfigService } from '@nestjs/config';
import { SignUpDto } from '../users/dto/create-user.dto';

import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService, private readonly httpService: HttpService) {}

  @Post('signup')
  signup(@Body() createUserDto: SignUpDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('signin')
  signin(@Body() authDto: AuthDto) {
    return this.authService.signIn(authDto);
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Get('logout')
  logout(@Req() req: Request) {
    this.authService.logout(req.user['sub']);
  }

  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @Get('refresh')
  refreshTokens(@Req() req: Request) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(AuthGuard('azure-ad-oauth2'))
  @Get('microsoft')
  microsoftLogin() {
    return true;
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('azure-ad-oauth2'))
  async azureAdOAuth2Callback(@Req() req) {
    const accessToken = req?.user?.accessToken;
    const decoded = jwt_decode(accessToken);
    return this.authService.SignInMicrosoft(decoded['unique_name'], decoded['given_name'], decoded['family_name'], decoded['puid']);
  }

  @Get('ess')
  @UseGuards(AuthGuard('oauth2'))
  essSignin() {
    return true;
  }

  @Get('ess/callback')
  @UseGuards(AuthGuard('oauth2'))
  async essCallback(@Req() req, @Res() res: Response): Promise<any> {
    const accessToken = req?.user?.accessToken;
    // const refreshToken = req?.user?.refreshToken;
    // const decoded = jwt_decode(accessToken);

    const redirectUrl = this.configService.get<string>('FRONTEND_URL');

    if (accessToken) {
      const { data } = await firstValueFrom(
        this.httpService
          .get('https://hcis-dev3.kallagroup.co.id/api/user', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              console.error(error.response.data);
              throw 'An error happened!';
            })
          )
      );

      const email = data?.data.email;
      const fullName = data?.data.person?.full_name;
      const authResult = await this.authService.essSignIn(email, fullName);

      res.redirect(`${redirectUrl}/auth/callback?token=${authResult.accessToken}&refreshToken=${authResult.refreshToken}`);
    }
  }
}
