#!/bin/sh
set -e

echo "Starting Convoyage Express API..."
exec gunicorn --bind 0.0.0.0:5000 --workers 4 "app:create_app()"
