# VAIM2 Master Integration Checklist

# A. Environment & Configuration

## 1. Align Environment Variables

### 1.1 Clone or Pull the Codebase
- [x] Make sure you have the vaim2/ repository locally
- [x] Directory references in this checklist assume the root of the monorepo is vaim2/

### 1.2 Check each Service's .env.example
- [x] Auth (services/auth-service/.env.example)
- [x] Graph Analytics (services/graph-analytics-service/.env.example)
- [x] LLM (services/llm-service/.env.example)
- [x] UI may have .env or .env.local (check services/ui-service/)
- [x] HPC stubs (research-corner) might only have partial references in code or Dockerfile

### 1.3 Unify Key Variables
- [x] Make sure Postgres, Neo4j, Redis, Kafka, etc. match or are correct in each microservice's .env
- [x] For example, if DB_HOST=auth-postgres in auth-service, confirm the same container name is used in the docker-compose.yml
- [x] If you're using Docker Compose for local dev, maintain consistency with the ports you see in docker-compose.yml at the root (like 5433:5432 for Postgres, 7688:7687 for Neo4j, etc.)

### 1.4 Resolve Port Conflicts
By default, the root docker-compose.yml uses:
- [x] Auth Service exposed on 3001:3000
- [x] Graph Analytics on 3002:3002
- [x] LLM Service might run on 3002 or 3003 if built separately; confirm in services/llm-service/docker-compose.yml
- [x] UI might run on 3000 or 5173 (depending on React/Vite config)
- [x] If you see conflicts, adjust ports in the relevant docker-compose.yml or environment variables

### 1.5 Secrets & Sensitive Keys
- [x] For local dev, you can keep them in .env files. Do not commit real secrets to version control
- [x] For LLM aggregator, you'll need the OpenRouter API key (OPENROUTER_API_KEY) which provides access to all required models
- [x] If you're using HPC stubs, no real HPC credentials are needed, but you might store references in research-corner/.env or as environment variables

# B. Service Alignment & Start-up Order

## 1. Prepare Docker Services

### 1.1 Core DB/Cache
- [x] Postgres, Neo4j, Redis, Kafka, Zookeeper from the root docker-compose.yml
- [x] Confirm environment variables in .env or override with Docker Compose

### 1.2 Auth Service
- [x] Dependent on Postgres (for user data) and Neo4j (for advanced user relationships or SQT references)
- [x] Check services/auth-service/.env.example: make sure it points to auth-postgres and auth-neo4j
- [x] If everything is consistent, run `docker-compose up -d auth-service`

### 1.3 Graph Analytics Service
- [x] Dependent on Neo4j (graph DB), Kafka, Redis (for caching or job scheduling)
- [x] Check services/graph-analytics-service/.env.example or your .env for NEO4J_URI=bolt://auth-neo4j:7687 (or the mapped port from Docker)
- [x] Bring it up with `docker-compose up -d graph-analytics-service`

### 1.4 LLM Service
- [x] Typically depends on Redis (for caching/rate-limiting)
- [ ] If it's in the root docker-compose.yml, do `docker-compose up -d llm-service`
- [x] If it has its own docker-compose.yml, run `docker compose -f services/llm-service/docker-compose.yml up -d`
- [ ] Confirm you have set your OpenRouter API key in .env for accessing all LLM models

### 1.5 UI Prototype
- [ ] Often runs on port 3000 or 5173
- [ ] If it's included in the root Docker Compose, run `docker-compose up -d ui-service`
- [ ] If it's separate, do `npm install && npm run dev` inside services/ui-service/
- [ ] Confirm you have environment variables pointing to AUTH_SERVICE_URL, GRAPH_ANALYTICS_URL, LLM_SERVICE_URL, etc.

## 2. Verify Each Service

### 2.1 Check Auth
- [ ] Curl or browser to http://localhost:3001/health (assuming 3001 is the mapped port)
- [ ] Look for logs in `docker-compose logs auth-service`

### 2.2 Check Graph Analytics
- [ ] Curl http://localhost:3002/api/v1/analytics/health or similar endpoint
- [ ] Look for logs in `docker-compose logs graph-analytics-service`

### 2.3 Check LLM Service
- [x] Curl http://localhost:3003/api/v1/monitoring/health (if 3003 is your mapped port)
- [x] Verify logs: `docker-compose logs llm-service`
- [x] Confirm Redis and provider health status in response

### 2.4 UI
- [ ] Load http://localhost:3000 (if you didn't change the port)
- [ ] If using React dev server, you might see http://localhost:5173

# C. HPC/Quantum Stubs

## 1. Minimal HPC References

### 1.1 Research-Corner
- [ ] HPC or quantum references typically in research-corner/
- [ ] You can spin up the "fake HPC container" if it exists (like Dockerfile.research)
- [ ] If you do: `docker build -f Dockerfile.research -t quantum-research . && docker run quantum-research`, you get a stub HPC environment

### 1.2 Testing HPC Placeholders
- [ ] If research-corner has a quantum or HPC job endpoint, run `curl http://localhost:300X/hpc/job` to see a mock response
- [ ] Alternatively, if HPC is not crucial right now, skip it. HPC stubs won't block the rest from working

### 1.3 Local "Fake" HPC
- [ ] If you want a local Slurm-like environment, you can spin up a Slurm Docker container for testing (unofficial images exist)
- [ ] Not strictly necessary to get the prototype running, so treat HPC as optional

# D. LLM Aggregator Testing

## 1. Configure LLM Environment

### 1.1 Configure OpenRouter
In services/llm-service/.env (or .env.local), set:
```bash
OPENROUTER_API_KEY=your-openrouter-key
DEFAULT_LLM_PROVIDER=openrouter
```
- [ ] Verify OpenRouter API key is valid and has access to required models

### 1.2 Check Rate-Limiting
- [ ] RATE_LIMIT_MAX, RATE_LIMIT_TTL in .env
- [ ] If you want to skip rate-limiting, set CACHE_ENABLED=false or similar

## 2. Verify a Minimal Usage Scenario

### 2.1 Hit the Aggregator
```bash
curl -X POST http://localhost:3003/api/v1/llm/complete \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello from VAIM2 aggregator!"}]}'
```
- [ ] Look for a JSON response with text, metadata, etc.

### 2.2 Test Streaming
- [ ] curl -N http://localhost:3003/api/v1/llm/complete/stream ... with SSE headers
- [ ] Observe partial responses chunked back if the service supports streaming

### 2.3 Check Logs
- [ ] `docker-compose logs llm-service` to confirm no authentication or rate-limit errors

# E. Graph Analytics & SQT Integration

## 1. Store "Thought Steps" in Neo4j (Sequential Thinking)

### 1.1 SQT Logic Setup
- [ ] The "SQT" or "Sequential Thinking" references typically store chain-of-thought steps as nodes
- [ ] Confirm Auth or Graph Analytics service calls something like POST /sqt/addThought or POST /graph-analytics/sqt/thought

### 1.2 Add or Branch Thoughts
- [ ] Possibly tested via LLM aggregator or a direct Graph Analytics endpoint
- [ ] For example, POST /api/v1/analytics/thought with JSON content
- [ ] Or from the UI Chat panel, a new node is created in the graph referencing a chain-of-thought

## 2. Run Daily/Weekly Graph Analytics

### 2.1 Check Cron or Scheduling
- [ ] The Graph Analytics service may have a daily job for PageRank or GDS tasks
- [ ] Confirm environment variables like PIPELINE_DAILY_ANALYTICS_ENABLED=true
- [ ] If you want to test it immediately, look for an endpoint like POST /api/v1/analytics/runDaily or manually invoke the code that triggers PageRank

### 2.2 View Analytics Results
- [ ] The logs in the Graph Analytics container should mention "PageRank job completed" or any GDS stats
- [ ] In the UI, if the UI displays metrics (like centrality or bridging), you might see updated node scores

### 2.3 Check HPC Synergy (Optional)
- [ ] If HPC stubs are integrated, the daily analytics might "simulate" HPC usage
- [ ] Look for HPC references in logs or an HPC endpoint call. This is just a simulation in the current code

# F. UI Prototype Unification

## 1. Connect UI to All Services

### 1.1 Auth
- [ ] In services/ui-service/.env or wherever config is set, ensure REACT_APP_AUTH_URL or VITE_AUTH_URL points to http://localhost:3001
- [ ] The UI might fetch user info, login, logout endpoints from Auth

### 1.2 Graph Analytics
- [ ] Ensure REACT_APP_GRAPH_ANALYTICS_URL or VITE_GRAPH_URL is http://localhost:3002
- [ ] UI's GraphCanvas or wherever the graph is fetched might call these endpoints

### 1.3 LLM
- [ ] Set REACT_APP_LLM_URL=http://localhost:3003 for OpenRouter integration
- [ ] Configure the Chat panel to use OpenRouter models through the aggregator
- [ ] Verify proper handling of streaming responses in the UI

### 1.4 SQT
- [ ] Possibly the UI calls POST /graph-analytics-service/sqt/addThought or the relevant route
- [ ] Make sure the UI references the correct path

## 2. Validate Basic UI Flow

### 2.1 Open the UI
- [ ] http://localhost:3000 (or whatever port React is on)
- [ ] If you see a login or home screen, proceed

### 2.2 Authenticate
- [ ] Try creating an account or logging in with your local Auth service
- [ ] Check for a JWT or session in the dev console

### 2.3 View Graph
- [ ] The UI should show a basic Cytoscape.js canvas
- [ ] If no nodes exist, add some via the UI (Toolbar "Add Node" button)

### 2.4 Real-Time Collaboration
- [ ] If you open the UI in two browser windows, see if node additions appear in both
- [ ] This uses Socket.io or websockets

### 2.5 LLM Integration
- [ ] Test the Chat panel with real prompts through OpenRouter
- [ ] Verify responses are properly displayed in the UI
- [ ] Confirm streaming responses are handled correctly

### 2.6 Branching Thoughts
- [ ] If SQT integration is present, create or branch a "thought"
- [ ] Inspect Neo4j data (:7475 for Neo4j browser) to see a new "thought node" or relationships

# G. Testing & Validation

## 1. Recommended Test Approach

### 1.1 Unit Tests
Each service has npm run test or a Jest config. For example:
```bash
cd services/auth-service && npm run test
cd services/graph-analytics-service && npm run test
cd services/llm-service && npm run test
cd services/ui-service && npm run test
```

### 1.2 Integration Tests
- [ ] Many are triggered via docker-compose.test.yml for Auth or Graph Analytics
- [ ] For instance, `docker-compose -f services/auth-service/docker-compose.test.yml up --build --abort-on-container-exit`

### 1.3 E2E
- [ ] The UI might have Cypress or Playwright tests
- [ ] If configured, run `npm run test:e2e` in services/ui-service

### 1.4 Multi-Service
- [ ] Spin up everything with `docker-compose up -d`, then run an e2e script that logs in, fetches HPC analytics, etc.

## 2. Monitoring Setup

### 2.1 Prometheus Configuration
- [ ] Verify Prometheus configuration in services/graph-analytics-service/src/monitoring/
- [ ] Check Prometheus metrics endpoints are exposed (typically :9090)
- [ ] Confirm metrics are being collected from all services that expose them
- [ ] Test basic monitoring dashboards if configured

### 2.2 Service Metrics
- [ ] Verify Graph Analytics service metrics are being collected
- [ ] Check LLM service performance metrics
- [ ] Monitor Auth service authentication/authorization metrics
- [ ] Set up alerts for critical service metrics if needed

## 3. Sample End-to-End Steps

### 3.1 Login
- [ ] POST /auth-service/api/login with test user
- [ ] Expect 200 + a JWT

### 3.2 Add Node to Graph
- [ ] In UI or via Graph Analytics API, create a node
- [ ] Confirm in Neo4j or the UI that it appears

### 3.3 LLM Integration
- [ ] Test LLM completion through OpenRouter with a real query
- [ ] Verify streaming responses work correctly with OpenRouter models
- [ ] Check response includes proper metadata and model information

### 3.4 Check HPC Stub
- [ ] Optional. `curl http://localhost:XXXX/hpc/testJob`
- [ ] Confirm logs or a mock HPC response

# H. Deployment & Next Steps

## 1. Staging Environment Setup

### 1.1 Domain & SSL
- [ ] If you have a domain, point an A record to your staging server
- [ ] Use Nginx or Traefik to route subdomains to each microservice if needed

### 1.2 Environment Files
- [ ] .env.production for each microservice
- [ ] Secrets from a vault or AWS Secrets Manager

### 1.3 K8s or Compose in Staging
- [ ] If you prefer Docker Compose, replicate the same approach on a staging VM
- [ ] For Kubernetes, create Deployment and Service manifests for each microservice, hooking them together

## 2. Potential Pitfalls

### 2.1 JWT Secret Mismatch
- [ ] Ensure the UI, LLM, Graph, and Auth share the same JWT_SECRET if needed

### 2.2 Redis Collisions
- [ ] Confirm each service either uses a different Redis DB or the same DB with proper key prefixes

### 2.3 Neo4j & HPC Resource Usage
- [ ] Watch out for memory usage in staging or production

### 2.4 LLM API Key Overuse
- [ ] Rate-limits or costs can spike if you use real providers heavily

## 3. Time Estimates & Refactoring
- [ ] A few days to unify environment configs, test Docker flow, fix small port or service references
- [ ] Another day to confirm HPC or quantum stubs if you want them actively tested
- [ ] Refactoring might be needed if environment variables drift or if the HPC research corner changes

## 4. Final Milestone

### 4.1 Confirm you can:
- [ ] Log in from the UI (Auth checks out)
- [ ] See a live graph in the UI
- [ ] Add/branch thoughts and confirm they store in Neo4j
- [ ] Use LLM aggregator from the UI (Chat or suggestion panel)
- [ ] (Optional) HPC stub is recognized or logs a mock HPC job
- [ ] Daily analytics runs or is triggered, producing logs or updated graph metrics

### 4.2 Missing Pieces & Disclaimers
- [ ] LLM Integration: OpenRouter provides unified access to multiple models (GPT, Claude, DeepSeek, etc.) through a single API key
- [ ] HPC Stubs: Only partially implemented; no real HPC scheduling in the provided code
- [ ] Performance & Production Hardening: Consider scaling or load tests if you have large datasets
- [ ] Quantum: Merely references in research-corner. Real quantum code is not included

### 4.3 Verifying From the User's Perspective
- [ ] Open the UI in a browser
- [ ] Register/Login via Auth
- [ ] Observe the Graph (should have a default or an empty workspace)
- [ ] Add a Node or run a Chat prompt to create a new node
- [ ] Check Real-Time collaboration by opening a second browser or incognito
- [ ] Trigger an LLM completion from the UI Chat
- [ ] Verify chain-of-thought is recorded in Neo4j (use Neo4j Browser)
- [ ] Optionally watch daily analytics job logs (or trigger it manually) for HPC synergy references
- [ ] If all the above steps succeed, you have an integrated local prototype of VAIM2 + SQT
