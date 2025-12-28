import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login
  // hash kontrolü
  @Post('login')
  async login(@Body() body: any) {
    // body: { kullaniciAdi, sifre }
    return this.authService.login(body);
  }

  // (Opsiyonel) POST /auth/register-personel
  // Şifre hashleme ve personel oluşturma
  @Post('register-personel')
  async register(@Body() body: any) {
    // body: { kullaniciAdi, sifre, rol, adSoyad }
    return this.authService.createPersonel(body);
  }
}
