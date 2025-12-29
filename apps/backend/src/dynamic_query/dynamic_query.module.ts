import { Module } from '@nestjs/common';
import { DynamicQueryController } from './dynamic_query.controller';
import { DynamicQueryService } from './dynamic_query.service';

@Module({
  controllers: [DynamicQueryController],
  providers: [DynamicQueryService],
})
export class DynamicQueryModule {}
