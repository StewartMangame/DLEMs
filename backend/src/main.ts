import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true, // Allow all origins for dev, or specify http://localhost:3000
    credentials: true,
  });
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip fields not in the DTO
      forbidNonWhitelisted: true, // Return 400 if unknown fields are sent
      transform: true, // Auto-convert types (e.g. string -> number)
    }),
  );
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
