mongodump --uri="mongodb://localhost:27017/WarframeStatsDB" --out="backup"
cd backup
file_name=/data/backup/ws_back_$(date +"%Y-%m-%d_%H-%M-%S").tgz
tar czf $file_name WarframeStatsDB
#chown 1002:1002 $file_name
rm -r /data/backup/WarframeStatsDB
