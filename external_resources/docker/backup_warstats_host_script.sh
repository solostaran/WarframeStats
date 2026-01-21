#!/bin/bash

# manually create a backup of the database
docker exec --user=1002 mongo-warstats-run /bin/sh -c "/data/backup_warstats_docker_script.sh"
# list the local backup files and display the last and more recent one
ls -1 ~/Warstats/volumes/backup-db | sort -n | tail -n 1
