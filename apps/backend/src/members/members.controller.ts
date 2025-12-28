import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
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
}
