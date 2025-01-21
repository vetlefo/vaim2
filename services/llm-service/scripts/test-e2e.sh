#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.e2e

# Function to cleanup resources
cleanup() {
    echo "Cleaning up test resources..."
    docker-compose -f docker-compose.test.yml down -v
    exit
}

# Trap cleanup function
trap cleanup EXIT INT TERM

echo "Starting end-to-end tests..."

# Ensure we're in the correct directory
cd "$(dirname "$0")/.."

# Build test images
echo "Building test images..."
docker-compose -f docker-compose.test.yml build

# Start test dependencies
echo "Starting test dependencies..."
docker-compose -f docker-compose.test.yml up -d redis-test

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
until docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done

# Run the tests
echo "Running end-to-end tests..."
docker-compose -f docker-compose.test.yml run --rm llm-service-e2e npm run test:e2e

# Get the exit code
TEST_EXIT_CODE=$?

# Output test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ End-to-end tests passed successfully!"
else
    echo "❌ End-to-end tests failed!"
    exit $TEST_EXIT_CODE
fi