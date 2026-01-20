#!/bin/sh
set -e

# Run Prisma migrations using local binary
echo "Running Prisma migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

# Start the application
echo "Starting application..."
exec node server.js
