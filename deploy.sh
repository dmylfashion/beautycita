#!/bin/bash
# BeautyCita Deployment Script

set -e

echo "=== BeautyCita Deployment ==="

# Navigate to backend directory
cd /var/www/beautycita.com/backend

# Install/update dependencies
echo "Installing dependencies..."
npm install --production

# Run database migrations (if applicable)
echo "Running database migrations..."
# npm run migrate || echo "No migrations to run"

# Start/restart with PM2
echo "Starting application with PM2..."
cd /var/www/beautycita.com
pm2 startOrRestart ecosystem.config.js

echo "✓ BeautyCita deployment complete"
echo "Check status: pm2 status beautycita-backend"
echo "View logs: pm2 logs beautycita-backend"
