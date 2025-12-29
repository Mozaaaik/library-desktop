import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DynamicQueryService } from './dynamic_query.service';

// Frontend isteği: http://localhost:3000/books/dynamic-search
// Bu yüzden 'dynamic-query' yerine 'books' dedik.
@Controller('books')
export class DynamicQueryController {
  constructor(private readonly dynamicQueryService: DynamicQueryService) {}

  @Get('categories')
  async getCategories() {
    return await this.dynamicQueryService.getCategories();
  }

  @Get('dynamic-search')
  async searchBooks(@Query() query: any) {
    try {
      const results = await this.dynamicQueryService.getDynamicBooks(query);
      return results; // Frontend direkt array bekliyor, obje içinde sarmalamadık.
    } catch (error) {
      throw new HttpException(
        'Sorgu çalıştırılamadı: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
