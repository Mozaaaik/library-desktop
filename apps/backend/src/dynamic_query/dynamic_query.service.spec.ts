import { Test, TestingModule } from '@nestjs/testing';
import { DynamicQueryService } from './dynamic_query.service';

describe('DynamicQueryService', () => {
  let service: DynamicQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamicQueryService],
    }).compile();

    service = module.get<DynamicQueryService>(DynamicQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
