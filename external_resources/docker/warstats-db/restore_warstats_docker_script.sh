#!/bin/bash

if [ ! $1 ]; then
	echo "Missing first argument = <backup_file_name>"
	exit 1
fi

cd /data/backup
tar xzf $1

mongorestore --uri="mongodb://localhost:27017/WarframeStatsDB" WarframeStatsDB
rm -r ./WarframeStatsDB
