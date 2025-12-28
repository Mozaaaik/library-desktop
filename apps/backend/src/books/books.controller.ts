import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { BooksService } from './books.service';


@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Get()
    async search(@Query('search') search = '') {
        return await this.booksService.searchBooks(search);
    }

    @Post()
    async addOrUpdateBook(@Body() body: any) {
        return await this.booksService.addBook(body);
    }

    @Put(':id')
    async updateBook(@Param('id') id: string, @Body() body: any) {
        return await this.booksService.updateBook(Number(id), body);
    }

    // SİLME
    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return await this.booksService.deleteBook(id);
    }

    //  Kategorileri getir
    @Get('categories')
    async categories() {
        return await this.booksService.listCategories();
    }

}
