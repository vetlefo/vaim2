import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Start server
  const port = configService.get<number>('PORT', 3002);
  await app.listen(port);

  const url = await app.getUrl();
  console.log(`🚀 LLM Service running on: ${url}`);
  console.log(`🔥 GraphQL Playground: ${url}/graphql`);
  console.log(`💓 Health Check: ${url}/health`);
}

bootstrap().catch((error) => {
  console.error('Failed to start LLM Service:', error);
  process.exit(1);
});