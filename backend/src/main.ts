import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true, // Allow all origins for dev, or specify http://localhost:3000
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip fields not in the DTO
      forbidNonWhitelisted: true, // Return 400 if unknown fields are sent
      transform: true, // Auto-convert types (e.g. string -> number)
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
