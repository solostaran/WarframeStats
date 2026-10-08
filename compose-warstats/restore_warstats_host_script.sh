#!/bin/bash

# work from the compose directory so relative paths resolve wherever the script is called from
cd "$(dirname "$0")"

if [ -z "$1" ]; then
	echo "Missing first argument = <backup_file_name> (from ./db-warstats/backup-volume)"
	exit 1
fi
# accept a bare file name or a path (e.g. from tab completion): the container only knows the name
backup_file=$(basename "$1")
if [ ! -f "./db-warstats/backup-volume/$backup_file" ]; then
	echo "Backup file not found: ./db-warstats/backup-volume/$backup_file"
	exit 1
fi

# call the docker script to import the backup file in argument (must be in the correct volume)
# run as the owner of the backup volume (1000 in dev, 1002 in prod)
docker exec --user=$(stat -c %u ./db-warstats/backup-volume) db-warstats-run /bin/sh -c "/data/restore_warstats_docker_script.sh $backup_file"
