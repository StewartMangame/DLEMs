import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoansService } from './loans.service';

@Controller('loans')
@UseGuards(AuthGuard('jwt'))
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  async getLoans(@Req() req: any) {
    return this.loansService.getUserLoans(req.user.userId);
  }

  @Post('manual')
  async recordLoan(@Req() req: any, @Body() body: any) {
    const loan = await this.loansService.createManualLoan(
      req.user.userId,
      body,
    );
    return { success: true, loan };
  }

  @Get('schedule/:id')
  async getSchedule(@Req() req: any, @Param('id') id: string) {
    return this.loansService.getRepaymentSchedule(
      req.user.userId,
      parseInt(id, 10),
    );
  }

  @Post('apply')
  async applyLoan(@Req() req: any, @Body() body: any) {
    const application = await this.loansService.applyLoan(
      req.user.userId,
      body,
    );
    return { success: true, application };
  }

  @Post('repay/:id')
  async repayLoan(@Req() req: any, @Param('id') id: string) {
    const loan = await this.loansService.repayLoan(
      req.user.userId,
      parseInt(id, 10),
    );
    return { success: true, loan };
  }

  @Delete(':id')
  async removeLoan(@Req() req: any, @Param('id') id: string) {
    await this.loansService.removeLoan(req.user.userId, parseInt(id, 10));
    return { success: true };
  }
}
