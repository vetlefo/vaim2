# TROUBLESHOOTING GUIDE

## 1. Why "invalid ELF header" Happens

You are seeing this error:

```
Error: /usr/src/app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: invalid ELF header
```

**Cause**
This typically means the native module (`bcrypt` in this case) was compiled on a different architecture/operating system than the one inside your Docker container. When Docker starts, it tries to use the already-compiled native binary from your local machine (Windows), but inside a Linux container—hence the mismatch.

**Main Fix**
Avoid copying `node_modules` from the host into the container. Instead, build/install dependencies *inside* the container. That way, any native modules (like `bcrypt`) get compiled for the correct environment (Linux).

---

## 2. Recommended Dockerfile Adjustments

Your Dockerfile (in `services/auth-service/Dockerfile`) should generally look like this:

```dockerfile
# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first, install dependencies
COPY package*.json ./

# Install dependencies (without copying local node_modules)
# We use `npm ci` if you have a package-lock.json, or `npm install` if not
RUN npm install --build-from-source

# Copy the rest of your service code
COPY . .

# Expose the port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
```

Important:

Make sure you do not have node_modules/ in your Docker build context. Either remove it or add it to your .dockerignore.
This ensures that the Docker image is building fresh Node modules for Linux, preventing the invalid ELF header errors.

## 3. .dockerignore

In the same directory as your Dockerfile (e.g., services/auth-service/.dockerignore), ensure you have:

```
node_modules
dist
.git
.gitignore
npm-debug.log
.env
```

This way, Docker does not copy your local node_modules into the image. On build, Docker installs dependencies from scratch, guaranteeing the correct binaries for Linux.

## 4. Handling the Dependency Conflicts

You had a peer dependency error with @nestjs/swagger being version 11.x while other Nest dependencies are 10.x. We pinned @nestjs/swagger at a version compatible with Nest v10 (e.g. ^10.1.5). After changing package.json, do:

- [ ] Remove node_modules locally:

```bash
rm -rf node_modules
```

(On Windows, you can delete the folder from File Explorer or `rmdir node_modules /S /Q` in Command Prompt.)

- [ ] Remove any package-lock.json if you want a fresh lock file:

```bash
rm package-lock.json
```

- [ ] Reinstall:

```bash
npm install
```

or

```bash
npm ci
```

Make sure the versions are aligned.

- [ ] Now rebuild your Docker image:

```bash
docker-compose -f services/auth-service/docker-compose.yml build
docker-compose -f services/auth-service/docker-compose.yml up -d
```

This ensures that inside the container, npm install (or npm ci) runs with the corrected versions of your packages.

## 5. Dealing with Environment Variables

When you run docker-compose up, you might see warnings such as:

```
time="... " level=warning msg="The \"JWT_SECRET\" variable is not set. Defaulting to a blank string."
```

If you rely on environment variables (like JWT_SECRET, REDIS_PASSWORD, etc.), you need to provide them via:

- [ ] An .env file in the same directory as your docker-compose.yml. For example:

```
JWT_SECRET=some-secret-here
REDIS_PASSWORD=redispass
```

- [ ] Inline environment variables in your shell:

```bash
JWT_SECRET=some-secret-here REDIS_PASSWORD=redispass docker-compose up
```

- [ ] PowerShell environment variables:

```powershell
$env:JWT_SECRET = "some-secret-here"
docker-compose up
```

- [ ] Or in the environment: section of your docker-compose.yml.
Without these, the container uses empty defaults and might break.

## 6. Kafka Timeout Waiting for ZooKeeper

Your logs show:

```
[2025-01-28 17:20:54,177] ERROR Timed out waiting for connection to Zookeeper server
```

That can happen if Kafka can’t connect to Zookeeper in time. Common reasons:

- [ ] DNS or networking:

Ensure your docker-compose.yml references the correct service names. Usually zookeeper is the service name if it’s in the same compose file.
- [ ] Zookeeper not finished starting:

Sometimes you need depends_on in your Kafka service to wait for Zookeeper.
Or add restart: always so that if it starts too early, it restarts automatically.
- [ ] Docker networks:

If you define multiple networks, ensure that Kafka and Zookeeper are in the same Docker network.
As long as Zookeeper eventually becomes healthy, Kafka should connect. If you keep seeing that error, you might try a longer KAFKA_ZOOKEEPER_CONNECT_TIMEOUT_MS or ensure your environment is sized well so it can start quickly.

## 7. Additional Troubleshooting Steps

During troubleshooting, we encountered persistent issues with starting the Docker containers, even after addressing dependency conflicts and environment variables.  The Redis port (6379) was repeatedly reported as already in use, despite no other Redis instances being found running on the system using Task Manager or PowerShell's `Get-Process` command.  Restarting Docker Desktop did not resolve the issue.  The `cd` command in the `docker-compose up` command was initially incorrectly specified, leading to path errors.  This was corrected to `cd services\auth-service`.  Despite these corrections, the issue persists.  Further investigation into Docker Desktop's logs and settings is recommended.

## 8. Summary of Next Steps

- [ ] Review Docker Desktop logs for detailed error messages.
- [ ] If the problem persists, consider reinstalling Docker Desktop or creating a new project.

By following these best practices, you should fix the bcrypt invalid ELF header error, keep your Nest dependencies stable, and get your entire Docker Compose stack up and running.