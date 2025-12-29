import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { LoansService } from './loans.service';

// 1. DTO (Veri Transfer Objeleri) Tanımları
export class CreateLoanDto {
  uyeId: number;
  kitapId: number;
  personelId: number;
}

export class ReturnBookDto {
  islemId: number;
  // Teslim tarihi opsiyonel olabilir, gelmezse sunucu o anki saati basar
  teslimTarihi?: number;
}

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  async borrowBook(@Body() body: CreateLoanDto) {
    return await this.loansService.createLoan(body);
  }

  @Post('return')
  async returnBook(@Body() body: ReturnBookDto) {
    return await this.loansService.returnBook({
      islemId: body.islemId,
      teslimTarihi: body.teslimTarihi || Date.now(),
    });
  }

  @Get('active')
  async active() {
    return this.loansService.active();
  }
  @Get('active/:uyeId')
  async getMemberActiveLoans(@Param('uyeId') uyeId: string) {
    return this.loansService.activeForMember(Number(uyeId));
  }
}
