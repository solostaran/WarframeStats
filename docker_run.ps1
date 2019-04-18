# Run Warstats' Node.js application server
# (production)
docker run --net=warstats-network --net-alias=net-app-warstats -p 443:443 --link net-db-warstats:net-db-warstats -e NODE_ENV=production -e DOCKER=true --name app-warstats --rm app-warstats