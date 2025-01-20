# Graph Analytics Service

A microservice for performing advanced graph analytics using Neo4j Graph Data Science (GDS) library and providing data integration capabilities.

## Features

- Graph Analytics
  - PageRank computation
  - Community detection
  - Node similarity analysis
  - Shortest path finding
- Graph Management
  - Graph projections creation and management
  - Real-time analytics processing
- Integration Support
  - Neo4j GDS integration
  - Event streaming with Kafka
  - Caching with Redis

## Prerequisites

- Node.js (v18 or later)
- Neo4j Database (with Graph Data Science library installed)
- Apache Kafka (optional, for event streaming)
- Redis (optional, for caching)

## Installation

```bash
# Install dependencies
npm install

# Build the service
npm run build
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Service Configuration
PORT=3002
NODE_ENV=development

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j

# Kafka Configuration (Optional)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=graph-analytics-service
KAFKA_GROUP_ID=graph-analytics-group
KAFKA_SSL_ENABLED=false

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Analytics Configuration
ANALYTICS_BATCH_SIZE=1000
ANALYTICS_SCHEDULE_ENABLED=true
ANALYTICS_SCHEDULE_CRON="0 0 * * *"

# Security
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=3600
```

## Running the Service

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## API Documentation

Once the service is running, visit `http://localhost:3002/api/docs` to access the Swagger documentation.

### Available Endpoints

- `POST /api/v1/analytics/pagerank` - Compute PageRank for nodes
- `POST /api/v1/analytics/communities` - Detect communities in the graph
- `POST /api/v1/analytics/similarity` - Calculate node similarity
- `POST /api/v1/analytics/shortest-path` - Find shortest path between nodes
- `POST /api/v1/analytics/graph-projections` - Create a graph projection
- `DELETE /api/v1/analytics/graph-projections/:name` - Drop a graph projection
- `GET /api/v1/analytics/health` - Check Neo4j connection health

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker Support

Build and run the service using Docker:

```bash
# Build the image
docker build -t graph-analytics-service .

# Run the container
docker run -p 3002:3002 --env-file .env graph-analytics-service
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is proprietary and confidential.