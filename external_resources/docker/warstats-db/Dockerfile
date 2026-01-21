FROM mongo:8.0.3

# first possibility : copying db into container (careful, this does not persist)
#COPY ./mongodb-warframestats-prod /data/db

# second possibility : local shared volume
USER mongodb
VOLUME /data/db
VOLUME /data/backup

WORKDIR /data
COPY --chown=1002 ./*.sh .
EXPOSE 27017
#CMD ["mongod", "--wiredTigerCacheSizeGB 1"]
CMD ["mongod"]
