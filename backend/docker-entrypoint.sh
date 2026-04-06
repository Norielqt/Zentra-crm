#!/bin/bash
set -e

echo "=== Zentra CRM startup ==="
echo "DB_HOST: ${DB_HOST}"
echo "DB_PORT: ${DB_PORT}"
echo "DB_DATABASE: ${DB_DATABASE}"
echo "DB_USERNAME: ${DB_USERNAME}"
echo "APP_ENV: ${APP_ENV}"

echo "=== Running migrations ==="
php artisan migrate --seed --force

echo "=== Starting server on port ${PORT:-8000} ==="
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
