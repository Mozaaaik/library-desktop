import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  // LİSTELEME
  // GET http://localhost:3000/returns/active?search=harry
  @Get('active')
  async getActiveLoans(@Query('search') search: string) {
    return await this.returnsService.getActiveLoans(search);
  }

  // İŞLEM YAPMA
  // POST http://localhost:3000/returns/process
  // Body: { "oduncId": 123 }
  @Post('process')
  async processReturn(@Body('oduncId') oduncId: number) {
    if (!oduncId) {
      throw new BadRequestException('OduncID gönderilmedi!');
    }
    return await this.returnsService.processReturn(oduncId);
  }
}
