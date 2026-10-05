#!/bin/bash

# work from the compose directory so it can be called from anywhere
cd "$(dirname "$0")"

docker compose -f docker-compose.dev.yml up -d
