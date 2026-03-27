import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 8000);
  const env = configService.get('NODE_ENV', 'development');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: corsOrigins.split(',').map((origin: string) => origin.trim()),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(port);

  logger.log(`============================================`);
  logger.log(`🚀 cnc-mayyanks-api is running!`);
  logger.log(`📍 Domain: https://cnc.mayyanks.app`);
  logger.log(`🔌 URL: http://localhost:${port}`);
  logger.log(`🌍 Environment: ${env}`);
  logger.log(`📚 Docs: http://localhost:${port}/api/docs`);
  logger.log(`============================================`);
}

bootstrap().catch((err) => {
  logger.error('Failed to bootstrap application', err);
  process.exit(1);
});
