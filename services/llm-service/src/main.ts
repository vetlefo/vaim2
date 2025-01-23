import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configure CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Last-Event-ID'],
    exposedHeaders: ['Content-Type', 'Last-Event-ID'],
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  await app.listen(3003);
  console.log('🚀 LLM Service running on: http://[::1]:3003');
  console.log('🔥 GraphQL Playground: http://[::1]:3003/graphql');
  console.log('💓 Health Check: http://[::1]:3003/api/v1/monitoring/health');
}

bootstrap();