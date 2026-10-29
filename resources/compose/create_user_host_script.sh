#!/bin/bash

# Creates a user in the database of the compose stack, with Docker only : the script runs in the application image, on the compose network.
# Usage : ./create_user_host_script.sh <email> [--dev]   (the password is asked twice)
# --dev : the stack of docker-compose.dev.yml (default : docker-compose.yml, production)
# A running database is used as is (the application keeps running), a stopped one is started then stopped again.

# work from the compose directory so relative paths resolve wherever the script is called from
cd "$(dirname "$0")"

if [ -z "$1" ]; then
	echo "Missing first argument = <email> of the user to create"
	exit 1
fi
compose_file=docker-compose.yml
if [ "$2" = "--dev" ]; then
	compose_file=docker-compose.dev.yml
fi

set -e
compose="docker compose -f $compose_file"

if [ -z "$($compose ps --status running -q db-warstats)" ]; then
	echo "Start the database"
	$compose up -d --wait db-warstats
	trap 'echo "Stop the database"; $compose stop db-warstats' EXIT
fi

# the scripts of the repository (resources/, read only) run in the application image
$compose run --rm --no-deps -e MONGO_URI=mongodb://net-db-warstats/WarframeStatsDB \
	-v "$PWD/../../resources:/home/node/WarframeStats/resources:ro" \
	app-warstats node resources/scripts/CreateUser.js "$1"
