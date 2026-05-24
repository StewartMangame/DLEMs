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
    const strings = await this.contentRepo.find({ order: { key: 'ASC' } });
    return strings.map((content) => ({
      key: content.key,
      english: content.english,
      chichewa: content.chichewa ?? '',
    }));
  }
}
