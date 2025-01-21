# Secrets Management Guide

This document outlines our approach to managing secrets and environment configurations across different environments.

## Overview

We use AWS Secrets Manager for secure storage and management of sensitive configuration values in production environments, while maintaining simple environment files for local development.

## Environment-Specific Configuration

### Development Environment

For local development, all configuration values are stored in a `.env` file. You can copy the `.env.example` template to get started:

```bash
cp .env.example .env
```

Development environment files contain all necessary values locally, making it easy to get started without additional setup.

### Production Environment

In production, sensitive values are stored in AWS Secrets Manager. The application expects the following AWS configuration:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SECRET_ID=auth-service/production
```

## Sensitive Values

The following sensitive values are managed through AWS Secrets Manager in production:

- Database credentials (DB_USER, DB_PASSWORD)
- Neo4j credentials (NEO4J_USER, NEO4J_PASSWORD)
- JWT secrets (JWT_SECRET)
- OAuth2 secrets (OAUTH2_STATE_SECRET)
- OAuth2 provider secrets (GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_SECRET)
- Redis password (REDIS_PASSWORD)

## AWS Secrets Manager Structure

In AWS Secrets Manager, secrets are stored as JSON with the following structure:

```json
{
  "DB_USER": "production-db-user",
  "DB_PASSWORD": "production-db-password",
  "NEO4J_USER": "production-neo4j-user",
  "NEO4J_PASSWORD": "production-neo4j-password",
  "JWT_SECRET": "production-jwt-secret",
  "OAUTH2_STATE_SECRET": "production-oauth2-state-secret",
  "GOOGLE_CLIENT_SECRET": "production-google-client-secret",
  "GITHUB_CLIENT_SECRET": "production-github-client-secret",
  "REDIS_PASSWORD": "production-redis-password"
}
```

## Setting Up AWS Secrets Manager

1. Create a new secret in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name auth-service/production \
     --description "Production secrets for auth-service" \
     --secret-string "{\"DB_USER\":\"value\",\"DB_PASSWORD\":\"value\",...}"
   ```

2. Ensure your AWS IAM role/user has the following permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue"
         ],
         "Resource": "arn:aws:secretsmanager:region:account:secret:auth-service/*"
       }
     ]
   }
   ```

## Local Development vs Production

### Local Development
- Uses `.env` file with all values
- No AWS configuration required
- Easy to modify values for testing
- Supports rapid development cycles

### Production
- Sensitive values stored in AWS Secrets Manager
- Non-sensitive configuration in `.env` file
- Enhanced security through access controls
- Centralized secret management
- Audit trail for secret access and modifications

## Best Practices

1. Never commit `.env` files to version control
2. Regularly rotate production secrets
3. Use different secret values for different environments
4. Maintain minimal access permissions in production
5. Regularly audit secret access logs
6. Use strong, unique values for all secrets

## Testing

For testing environments, use `.env.test` with test-specific values. The application will not attempt to access AWS Secrets Manager when `NODE_ENV=test`.

## Troubleshooting

If you encounter issues with secrets management:

1. Verify AWS credentials and permissions
2. Check AWS_SECRET_ID matches your secret name
3. Ensure all required secret keys are present in AWS Secrets Manager
4. Verify environment variables are properly loaded
5. Check application logs for specific error messages

## Migration Guide

When migrating existing secrets to AWS Secrets Manager:

1. Create the secret in AWS Secrets Manager
2. Update application AWS configuration
3. Verify application can access secrets
4. Remove sensitive values from existing `.env` files
5. Update deployment processes to include AWS configuration

Remember to coordinate secret rotation with deployment schedules to minimize service disruption.