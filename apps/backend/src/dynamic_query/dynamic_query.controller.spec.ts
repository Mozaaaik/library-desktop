import { Test, TestingModule } from '@nestjs/testing';
import { DynamicQueryController } from './dynamic_query.controller';

describe('DynamicQueryController', () => {
  let controller: DynamicQueryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicQueryController],
    }).compile();

    controller = module.get<DynamicQueryController>(DynamicQueryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
