import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // 1) Tarih Aralığı Ödünç
  // /reports/loans?startDate=2024-12-01&endDate=2024-12-29&memberId=all&category=all&status=all
  @Get('loans')
  async loans(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('memberId') memberId = 'all',
    @Query('category') category = 'all',
    @Query('status') status = 'all',
  ) {
    return this.reportsService.getLoansByDateRange({
      startDate,
      endDate,
      memberId,
      category,
      status,
    });
  }

  // 2) Geciken Kitaplar
  // /reports/overdue?memberId=all&category=all&minDays=3
  @Get('overdue')
  async overdue(
    @Query('memberId') memberId = 'all',
    @Query('category') category = 'all',
    @Query('minDays') minDays = '',
  ) {
    return this.reportsService.getOverdueLoans({
      memberId,
      category,
      minDays,
    });
  }

  // 3) En çok ödünç alınan
  // /reports/most-borrowed?startDate=2024-12-01&endDate=2024-12-29&category=all&topN=10
  @Get('most-borrowed')
  async mostBorrowed(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('category') category = 'all',
    @Query('topN') topN = '10',
  ) {
    return this.reportsService.getMostBorrowedBooks({
      startDate,
      endDate,
      category,
      topN,
    });
  }
}
