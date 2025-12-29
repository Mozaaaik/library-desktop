import { Controller, Get, Param, Patch, Query, ParseIntPipe } from "@nestjs/common";
import { FinesService } from "./fines.service";

@Controller("fines")
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  // GET /fines?memberId=1&from=2023-01-01&to=2023-12-31
  @Get()
  list(
    @Query("memberId") memberId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.finesService.list({
      memberId: memberId ? Number(memberId) : null,
      from: from?.trim() ? from : null,
      to: to?.trim() ? to : null,
    });
  }

  // GET /fines/:id
  @Get(":id")
  detail(@Param("id", ParseIntPipe) id: number) {
    return this.finesService.detail(id);
  }

  // PATCH /fines/:id/pay
  @Patch(":id/pay")
  pay(@Param("id", ParseIntPipe) id: number) {
    return this.finesService.pay(id);
  }
}
