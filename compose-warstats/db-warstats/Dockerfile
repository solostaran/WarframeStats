FROM mongo:8.0-noble

# first possibility : copying db into container (careful, this does not persist)
#COPY ./mongodb-warframestats-prod /data/db

# second possibility : local shared volume
USER mongodb
VOLUME /data/db
VOLUME /data/backup

WORKDIR /data
# owned by root, read and execute only: the user running the container cannot modify them
COPY --chmod=755 ./*.sh .
EXPOSE 27017
#CMD ["mongod", "--wiredTigerCacheSizeGB 1"]
CMD ["mongod"]
