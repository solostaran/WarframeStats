# call the docker script to import the backup file in argument (must be in the correct volume)
docker exec --user=1002 mongo-warstats-run /bin/sh -c "/data/restore_warstats_docker_script.sh $1"
