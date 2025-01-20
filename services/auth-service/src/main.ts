import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(AppConfigService);
  await app.listen(configService.port);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Environment: ${configService.nodeEnv}`);
}
bootstrap();