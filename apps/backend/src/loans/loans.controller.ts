import { Body, Controller, Get, Post } from '@nestjs/common';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Post()
    async borrowBook(@Body() body: any) {
        return await this.loansService.createLoan(body);
    }

    @Post('return')
    async returnBook(@Body() body: any) {
        return await this.loansService.returnBook(body);
    }

    @Get('active')
    async active() {
        return this.loansService.active();
    }

}
