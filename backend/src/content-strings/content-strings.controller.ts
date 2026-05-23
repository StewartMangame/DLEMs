import { Controller, Get } from '@nestjs/common';
import { ContentStringsService } from './content-strings.service';

@Controller('content/strings')
export class ContentStringsController {
  constructor(private readonly contentStringsService: ContentStringsService) {}

  @Get()
  async findAll() {
    return this.contentStringsService.findAll();
  }
}