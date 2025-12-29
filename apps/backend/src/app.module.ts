import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { LoansModule } from './loans/loans.module';
import { MembersModule } from './members/members.module';
import { FinesModule } from './fines/fines.module';
import { ReturnsModule } from './returns/returns.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [AuthModule, BooksModule, LoansModule, MembersModule, FinesModule, ReturnsModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
