#!/bin/sh
set -e

# Sync database schema with Prisma (creates tables if needed)
echo "Syncing database schema..."
node ./node_modules/prisma/build/index.js db push --accept-data-loss

# Start the application
echo "Starting application..."
exec node server.js
