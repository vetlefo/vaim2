# Auth Service

Authentication and authorization service for the application.

## Features
- User authentication
- Role-based access control
- JWT token management

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure environment variables
4. Start the service:
   ```bash
   npm run start:dev
   ```

## Docker Setup

The service uses Docker Compose for local development with the following containers:
- `auth-service`: The main authentication service
- `auth-postgres`: PostgreSQL database
- `auth-neo4j`: Neo4j graph database

Container naming follows the pattern `{service}-{database}` to avoid conflicts when running multiple microservices.

### Production Considerations

#### Secrets Management
For production deployments:
- DO NOT use the environment variables in docker-compose.yml directly
- Use a secrets management service like:
  - HashiCorp Vault
  - AWS Secrets Manager
  - GCP Secret Manager
  - Azure Key Vault
- Store sensitive data including:
  - Database credentials
  - JWT secrets
  - API keys
  - SSL/TLS certificates

#### Security Best Practices
1. Use non-root users in containers
2. Enable SSL/TLS for all services
3. Implement rate limiting
4. Use strong passwords and rotate them regularly
5. Enable database encryption at rest
6. Regular security audits and updates

## Environment Variables

| Variable         | Description                     | Default           |
|------------------|---------------------------------|-------------------|
| DB_HOST          | PostgreSQL host                 | auth-postgres     |
| DB_PORT          | PostgreSQL port                 | 5432              |
| DB_USER          | PostgreSQL user                 | admin             |
| DB_PASSWORD      | PostgreSQL password             | admin             |
| DB_NAME          | PostgreSQL database name        | auth              |
| NEO4J_URI        | Neo4j connection URI            | bolt://auth-neo4j:7687 |
| NEO4J_USER       | Neo4j username                  | neo4j             |
| NEO4J_PASSWORD   | Neo4j password                  | admin             |
| PORT             | Service port                    | 3000              |
| NODE_ENV         | Node environment                | development       |

**Note:** Default values are for local development only. Use secure values in production.

## API Documentation

### Health Check
- **GET** `/health`
  - Returns service health status including database connectivity

## Development

- Start development server:
  ```bash
  npm run start:dev
  ```

- Run tests:
  ```bash
  npm test
  ```

- Lint code:
  ```bash
  npm run lint
  ```

- Build for production:
  ```bash
  npm run build
  ```

## Production Deployment

1. Set up secrets management service
2. Configure environment-specific variables
3. Enable SSL/TLS
4. Set up monitoring and logging
5. Configure backup strategy
6. Implement CI/CD pipeline with security checks

For detailed deployment instructions, see [deployment guide](docs/deployment.md).

## Documentation

- [Implementation Details](docs/implementation.md) - Detailed service implementation guide
- [OAuth2 Implementation](docs/oauth2-implementation.md) - OAuth2 authentication flow documentation
- [Secrets Management](docs/secrets-management.md) - Security and secrets handling guide

## Related Documentation

- [Docker Setup](../tools/docker.md) - Global Docker configuration
- [CI/CD Pipeline](../workflows/cicd.md) - Deployment workflow