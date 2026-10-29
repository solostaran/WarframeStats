#!/bin/bash

# First start of a new installation : creates a user and inserts the default data (resources/seed) into an empty database.
# Needs Docker only : the scripts run in the application image, on the compose network.
# Usage : ./seed_warstats_host_script.sh <email>   (the password is asked twice)

# work from the compose directory so relative paths resolve wherever the script is called from
cd "$(dirname "$0")"

if [ -z "$1" ]; then
	echo "Missing first argument = <email> of the user to create"
	exit 1
fi

set -e
data_volume=./db-warstats/data-volume

# the containers run as the current user of the host (1000 in dev, 1002 in prod), the owner of the volumes
export WARSTATS_USER="$(id -u):$(id -g)"
if [ "$(stat -c %u:%g "$data_volume")" != "$WARSTATS_USER" ]; then
	echo "$data_volume must be owned by $WARSTATS_USER, the user that runs the containers on this host."
	exit 1
fi
if [ -n "$(ls -A "$data_volume" | grep -v '^.gitkeep$')" ]; then
	echo "$data_volume is not empty : seed a new installation only."
	exit 1
fi

compose="docker compose -f docker-compose.yml"

# Step 4, even when a step fails : stop the database (its data stays in ./db-warstats/data-volume)
trap 'echo "Step 4 : stop the database"; $compose down' EXIT

echo "Step 1 : start the database"
$compose up -d --build --wait db-warstats

# the scripts of the repository (resources/, read only) run in the application image
run="$compose run --rm --no-deps -e MONGO_URI=mongodb://net-db-warstats/WarframeStatsDB -v $PWD/../../resources:/home/node/WarframeStats/resources:ro app-warstats"

echo "Step 2 : create the user $1"
$run node resources/scripts/CreateUser.js "$1"

echo "Step 3 : insert the default data"
$run node resources/scripts/SeedDatabase.js
