#!/bin/bash

# work from the compose directory so relative paths resolve wherever the script is called from
cd "$(dirname "$0")"

# manually create a backup of the database
# run as the owner of the backup volume so the archive can be written there (1000 in dev, 1002 in prod)
docker exec --user=$(stat -c %u ./db-warstats/backup-volume) db-warstats-run /bin/sh -c "/data/backup_warstats_docker_script.sh"
# list the local backup files and display the last and more recent one
ls -1 ./db-warstats/backup-volume | sort -n | tail -n 1
