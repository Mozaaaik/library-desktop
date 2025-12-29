import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { LoansModule } from './loans/loans.module';
import { MembersModule } from './members/members.module';
import { FinesModule } from './fines/fines.module';

@Module({
  imports: [AuthModule, BooksModule, LoansModule, MembersModule, FinesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
