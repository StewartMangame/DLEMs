import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentString } from '../entities/content-string.entity';

@Injectable()
export class ContentStringsService {
  constructor(
    @InjectRepository(ContentString)
    private contentRepo: Repository<ContentString>,
  ) {}

  async findAll() {
    return this.contentRepo.find();
  }
}