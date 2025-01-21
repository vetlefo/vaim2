import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppConfigService } from './config.service';
import { SecretsManagerService } from './secrets-manager.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // AWS Credentials (required in production)
        AWS_REGION: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
        }),
        AWS_ACCESS_KEY_ID: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
        }),
        AWS_SECRET_ACCESS_KEY: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
        }),
        AWS_SECRET_ID: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
        }),

        // Database Configuration
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().when('NODE_ENV', {
          is: 'development',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_PASSWORD: Joi.string().when('NODE_ENV', {
          is: 'development',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_NAME: Joi.string().required(),

        // Neo4j Configuration
        NEO4J_URI: Joi.string().required(),
        NEO4J_USER: Joi.string().when('NODE_ENV', {
          is: 'development',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        NEO4J_PASSWORD: Joi.string().when('NODE_ENV', {
          is: 'development',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),

        // Application Configuration
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),
  ],
  providers: [AppConfigService, SecretsManagerService],
  exports: [AppConfigService, SecretsManagerService],
})
export class AppConfigModule {}