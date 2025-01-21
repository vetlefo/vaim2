# Secrets Management Guide

This document provides a comprehensive guide for managing secrets across all services in the project.

## Overview

Our project uses a multi-layered approach to secrets management:
- Environment-specific configuration files
- Secrets management services for production
- Secure environment variables in CI/CD
- Encryption at rest for sensitive data

## Development Environment

### Environment Files
- `.env.example` - Template with placeholder values
- `.env` - Local development configuration
- `.env.test` - Test environment configuration
- `.env.production` - Production environment template

### Best Practices
1. Never commit actual secrets to version control
2. Use strong, unique passwords for each service
3. Rotate secrets regularly
4. Implement proper access controls
5. Monitor secret usage and access patterns

## Production Environment

### Secrets Management Services
- HashiCorp Vault (primary)
- AWS Secrets Manager (cloud deployment)
- Azure Key Vault (alternative)
- GCP Secret Manager (alternative)

### Types of Secrets
1. Database Credentials
   - PostgreSQL access
   - Neo4j authentication
   - Redis passwords
2. API Keys
   - OpenRouter API key
   - Provider-specific keys
   - Third-party service credentials
3. JWT Tokens
   - Signing keys
   - Refresh token secrets
4. SSL/TLS Certificates
   - Service certificates
   - Client certificates
   - CA certificates

## Service-Specific Configuration

### Auth Service
- [Detailed Auth Service Secrets](../services/auth-service/docs/secrets-management.md)
- JWT token management
- OAuth2 provider credentials
- Database access credentials

### Graph Analytics Service
- Neo4j authentication
- Kafka credentials
- Redis authentication
- Analytics API keys

### LLM Service
- Provider API keys (OpenRouter, DeepSeek, Claude)
- Rate limiting configuration
- Cache encryption keys
- Service authentication tokens

## CI/CD Integration

### GitHub Actions
- Secure secrets storage
- Environment-specific variables
- Deployment credentials

### Docker Configuration
- Runtime secrets injection
- Container security context
- Network isolation

## Security Monitoring

### Audit Logging
- Secret access patterns
- Failed authentication attempts
- Configuration changes

### Alerts
- Unauthorized access attempts
- Secret rotation reminders
- Expiration notifications

## Related Documentation
- [Docker Setup](docker.md)
- [CI/CD Pipeline](../workflows/cicd.md)
- [Auth Service Implementation](../services/auth-service/docs/implementation.md)