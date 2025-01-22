# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# First copy all source files
COPY . .

# Install dependencies including dev dependencies for build
RUN echo "=== Installing dependencies ===" && \
    npm ci && \
    echo "=== Installing @nestjs/cli ===" && \
    npm install -g @nestjs/cli && \
    npm list -g @nestjs/cli && \
    echo "=== Source files in /app ===" && \
    ls -la /app/src && \
    echo "=== Building application ===" && \
    npm run build && \
    echo "=== Build output ===" && \
    ls -la /app/dist && \
    echo "=== Moving files from dist/src ===" && \
    mv /app/dist/src/* /app/dist/ && \
    rm -rf /app/dist/src && \
    echo "=== Final dist contents ===" && \
    ls -la /app/dist && \
    echo "=== Contents of main.js ===" && \
    cat /app/dist/main.js | head -n 5 && \
    echo "=== Verifying main.js exists ===" && \
    test -f /app/dist/main.js || exit 1

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN echo "=== Installing production dependencies ===" && \
    npm ci --only=production

# Create dist directory
RUN mkdir -p /app/dist

# Copy built application from builder stage with explicit paths
COPY --from=builder /app/dist/ /app/dist/
COPY --from=builder /app/node_modules/ /app/node_modules/

# Debug: List contents and verify files
RUN echo "=== Production stage: Listing /app directory ===" && \
    ls -la /app && \
    echo "=== Production stage: Listing dist directory ===" && \
    ls -la /app/dist && \
    echo "=== Production stage: Contents of main.js ===" && \
    cat /app/dist/main.js | head -n 5 && \
    echo "=== Production stage: Verifying main.js exists ===" && \
    test -f /app/dist/main.js || exit 1

# Copy necessary files with explicit paths
COPY .env.example /app/.env

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set ownership with explicit paths
RUN chown -R nestjs:nodejs /app && \
    echo "=== Final file permissions ===" && \
    ls -la /app && \
    ls -la /app/dist

# Switch to non-root user
USER nestjs

# Expose ports
EXPOSE 3003
EXPOSE 9464
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health || exit 1

# Start application with explicit path
CMD ["node", "/app/dist/main.js"]