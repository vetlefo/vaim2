# Docker Setup Guide

## Overview
This document outlines the Docker configuration for the project's microservices architecture, with a focus on the authentication service.

## Prerequisites
- Docker Desktop installed and running
- Docker Compose installed
- Node.js and npm installed

## Development Environment

### Directory Structure
```
/services
  /auth-service
    Dockerfile
    docker-compose.yml
    docker-compose.test.yml
    .env
    .env.test
```

### Configuration Files

#### Dockerfile
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

#### Docker Compose (Development)
```yaml
version: '3.8'
services:
  auth-service:
    build: ./services/auth-service
    ports:
      - "3001:3000"
    depends_on:
      - auth-postgres
      - auth-neo4j
    environment:
      NODE_ENV: development
      DB_HOST: auth-postgres
      DB_PORT: 5432
      DB_USER: ${POSTGRES_USER:-admin}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-admin}
      DB_NAME: ${POSTGRES_DB:-auth}
      NEO4J_URI: bolt://auth-neo4j:7687
      NEO4J_USER: ${NEO4J_USER:-neo4j}
      NEO4J_PASSWORD: ${NEO4J_PASSWORD:-password123}

  graph-analytics-service:
    build: ./services/graph-analytics-service
    ports:
      - "3002:3002"
    depends_on:
      - auth-neo4j
      - kafka
      - redis
    environment:
      NODE_ENV: development
      PORT: 3002
      NEO4J_URI: bolt://auth-neo4j:7687
      NEO4J_USERNAME: ${NEO4J_USER:-neo4j}
      NEO4J_PASSWORD: ${NEO4J_PASSWORD:-password123}
      NEO4J_DATABASE: neo4j
      KAFKA_BROKERS: kafka:9092
      KAFKA_CLIENT_ID: graph-analytics-service
      KAFKA_GROUP_ID: graph-analytics-group
      REDIS_HOST: redis
      REDIS_PORT: 6379

  auth-postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-admin}
      POSTGRES_DB: ${POSTGRES_DB:-auth}
    ports:
      - "5433:5432"
    volumes:
      - auth-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-auth}"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-neo4j:
    image: neo4j:5-enterprise
    environment:
      NEO4J_AUTH: ${NEO4J_USER:-neo4j}/${NEO4J_PASSWORD:-password123}
      NEO4J_ACCEPT_LICENSE_AGREEMENT: 'yes'
      NEO4J_dbms_security_procedures_unrestricted: "gds.*"
      NEO4J_dbms_security_procedures_whitelist: "gds.*"
    ports:
      - "7475:7474"
      - "7688:7687"
    volumes:
      - auth-neo4j-data:/data
      - ./neo4j/plugins:/plugins
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:7474 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9093:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    ports:
      - "2182:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  auth-postgres-data:
  auth-neo4j-data:
  redis-data:

networks:
  auth-network:
    driver: bridge
  analytics-network:
    driver: bridge
```

#### Docker Compose (Testing)
```yaml
version: '3.8'
services:
  auth-service:
    build: ./services/auth-service
    ports:
      - "3001:3000"
    depends_on:
      - auth-postgres
      - auth-neo4j
    environment:
      NODE_ENV: test
      DB_HOST: auth-postgres
      DB_PORT: 5432
      DB_USER: ${POSTGRES_USER:-test}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-test123}
      DB_NAME: ${POSTGRES_DB:-test_auth}
      NEO4J_URI: bolt://auth-neo4j:7687
      NEO4J_USER: ${NEO4J_USER:-neo4j}
      NEO4J_PASSWORD: ${NEO4J_PASSWORD:-password123}

  graph-analytics-service:
    build: ./services/graph-analytics-service
    ports:
      - "3002:3002"
    depends_on:
      - auth-neo4j
      - kafka
      - redis
    environment:
      NODE_ENV: test
      PORT: 3002
      NEO4J_URI: bolt://auth-neo4j:7687
      NEO4J_USERNAME: ${NEO4J_USER:-neo4j}
      NEO4J_PASSWORD: ${NEO4J_PASSWORD:-password123}
      NEO4J_DATABASE: neo4j
      KAFKA_BROKERS: kafka:9092
      KAFKA_CLIENT_ID: graph-analytics-service-test
      KAFKA_GROUP_ID: graph-analytics-group-test
      REDIS_HOST: redis
      REDIS_PORT: 6379

  auth-postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-test}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-test123}
      POSTGRES_DB: ${POSTGRES_DB:-test_auth}
    ports:
      - "5433:5432"
    volumes:
      - auth-postgres-test-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-test} -d ${POSTGRES_DB:-test_auth}"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-neo4j:
    image: neo4j:5-enterprise
    environment:
      NEO4J_AUTH: ${NEO4J_USER:-neo4j}/${NEO4J_PASSWORD:-password123}
      NEO4J_ACCEPT_LICENSE_AGREEMENT: 'yes'
      NEO4J_dbms_security_procedures_unrestricted: "gds.*"
      NEO4J_dbms_security_procedures_whitelist: "gds.*"
    ports:
      - "7475:7474"
      - "7688:7687"
    volumes:
      - auth-neo4j-test-data:/data
      - ./neo4j/plugins:/plugins
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:7474 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9093:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    ports:
      - "2182:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-test-data:/data

volumes:
  auth-postgres-test-data:
  auth-neo4j-test-data:
  redis-test-data:

networks:
  auth-network:
    driver: bridge
  analytics-network:
    driver: bridge
```

## Usage

### Development Environment
1. Start the development environment:
   ```bash
   docker-compose up -d
   ```

2. Stop the development environment:
   ```bash
   docker-compose down
   ```

### Test Environment
1. Start the test environment:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Stop the test environment:
   ```bash
   docker-compose -f docker-compose.test.yml down
   ```

### Health Checks
- Auth Service: `curl http://localhost:3001/health`
- Graph Analytics Service: `curl http://localhost:3002/api/v1/analytics/health`
- PostgreSQL: `curl http://localhost:5433`
- Neo4j Browser: `http://localhost:7475`
- Neo4j Bolt: `bolt://localhost:7688`
- Kafka: `nc -zv localhost 9093`
- Zookeeper: `nc -zv localhost 2182`
- Redis: `nc -zv localhost 6380`

## Troubleshooting

### Common Issues
1. Port Conflicts
   - Solution: Update port mappings in docker-compose files
   - Example: Change "3001:3000" to "3002:3000"

2. Database Connection Issues
   - Check health check endpoints
   - Verify environment variables
   - Ensure services are healthy using `docker-compose ps`
   - For Neo4j: Ensure password meets minimum length requirement (8 characters)

3. Container Startup Order
   - Using `depends_on` with health checks
   - Proper service initialization order

### Port Mappings
Current service ports:
- Auth Service: 3001:3000
- Graph Analytics Service: 3002:3002
- PostgreSQL: 5433:5432 (changed to avoid conflicts)
- Neo4j Browser: 7475:7474 (changed to avoid conflicts)
- Neo4j Bolt: 7688:7687 (changed to avoid conflicts)
- Kafka: 9093:9092 (changed to avoid conflicts)
- Zookeeper: 2182:2181 (changed to avoid conflicts)
- Redis: 6380:6379 (changed to avoid conflicts)

### Service Configuration
Key environment variables:
- Neo4j: 
  - Default credentials: neo4j/password123 (minimum 8 characters required)
  - Enterprise edition with Graph Data Science library
- PostgreSQL:
  - Default credentials: admin/admin
- Redis:
  - No authentication required in development
- Kafka:
  - Bootstrap server: kafka:29092 (internal), localhost:9093 (external)

### Logs
View container logs:
```bash
docker-compose logs [service-name]
docker-compose -f docker-compose.test.yml logs [service-name]
```

## Best Practices
1. Use multi-stage builds for production
2. Implement proper health checks
3. Version control Docker files
4. Use environment variables for configuration
5. Regular security updates
6. Proper resource limits

## Related Documentation
- [CI/CD Pipeline](../workflows/cicd.md)
- [Phase 1 Timeline](../implementation/phase1-timeline.md)
