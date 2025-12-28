import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { pool } from './db/mysql';   
// pool = MySQL bağlantı havuzu
// MySQL’e bağlı aktif bağlantılar içerir

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Test amaçlı basit bir DB sorgusu
  @Get('db-test')
  async testdb ()  {
    const [rows] = await pool.query('SELECT USER() AS user, DATABASE() AS db')
    return rows;

  }

  
}


