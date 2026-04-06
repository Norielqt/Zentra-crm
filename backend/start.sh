#!/bin/bash
set -e

# Railway injects $PORT — configure Apache to listen on it
if [ -n "$PORT" ]; then
    sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
    sed -i "s/*:80>/*:$PORT>/g" /etc/apache2/sites-available/000-default.conf
fi

exec apache2-foreground
