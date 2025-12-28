import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async search(@Query('search') search = '') {
    return await this.booksService.searchBooks(search);
  }

  @Post()
  async addOrUpdateBook(@Body() body: any) {
    return await this.booksService.addOrUpdateBook(body);
  }
}
