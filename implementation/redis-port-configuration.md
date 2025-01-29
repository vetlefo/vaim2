# Redis Port Configuration Guide

## Problem Statement
Multiple services are conflicting on Redis host port 6380:

```bash
Error: Bind for 0.0.0.0:6380 failed: port is already allocated
```

### Solution Plan
Assign unique host ports for Redis in each service. Update Docker compose files and environment variables. Maintain consistency within service configurations.

### Port Assignment Table
| Service                  | Current Port | New Port |
|--------------------------|--------------|----------|
| auth-service             | 6379         | Keep     |
| llm-service              | 6380         | 6381     |
| graph-analytics-service | 6380         | 6382     |
| ui-service               | 6380         | 6383     |

### Implementation Steps
1. **llm-service changes**
   - **File:** `services/llm-service/docker-compose.yml`

   ```yaml
   redis:
     image: redis:7-alpine
     container_name: llm-redis
     ports:
       - "6381:6379"
   ```

   - **Update environment variables if needed:**

   ```env
   REDIS_PORT=6381
   ```

2. **graph-analytics-service changes**
   - **File:** `services/graph-analytics-service/docker-compose.yml`

   ```yaml
   redis:
     image: redis:alpine
     ports:
       - "6382:6379"
   ```

3. **ui-service changes**
   - **File:** `services/ui-service/docker-compose.yml`

   ```yaml
   redis:
     image: redis:latest
     ports:
       - "6383:6379"
   ```

### Verification Steps
1. Rebuild containers:
   ```bash
   docker-compose down && docker-compose up -d --build
   ```

2. Check running ports:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Ports}}"
   ```

### Notes
- Maintain Redis port consistency between compose files and env vars.
- Update CI/CD pipelines if using fixed ports.
- Consider using dynamic port allocation for future services.