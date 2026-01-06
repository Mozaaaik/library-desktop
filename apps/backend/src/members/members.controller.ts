import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';

import * as membersService_1 from './members.service';

@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: membersService_1.MembersService,
  ) {}

  @Get()
  getAll() {
    return this.membersService.findAll();
  }

  @Post()
  create(@Body() body: membersService_1.CreateMemberDto) {
    return this.membersService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: membersService_1.CreateMemberDto,
  ) {
    return this.membersService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(+id);
  }

  // Üyenin ödünç kitapları
  // GET /members/:id/loans?active=true
  // members.controller.ts
  @Get(':id/loans')
  async getLoans(@Param('id') id: string, @Query('active') active?: string) {
    const onlyActive = String(active || '').toLowerCase() === 'true';

    const data = await this.membersService.findLoans(+id, onlyActive);

    console.log('[GET /members/:id/loans] id=', id, 'active=', active);
    console.log(
      '[GET /members/:id/loans] type=',
      Array.isArray(data) ? 'array' : typeof data,
    );
    console.log(
      '[GET /members/:id/loans] count=',
      Array.isArray(data) ? data.length : 'n/a',
    );
    console.log(
      '[GET /members/:id/loans] sample=',
      Array.isArray(data) ? data[0] : data,
    );

    return data;
  }
}
