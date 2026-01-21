# WarframeStats
Get &amp; display statistics on Warframe's rewards.

## Installation
`npm install --save-dev cross-env`

Why '--save-dev'? To set environment variables in a cross-platform way using npm commands.
You also need a localhost MongoDB database.
You don't need to expose the database other than to the localhost.

## Launch
### Setting up environment variables
NODE_ENV={development or production} : some functionalities aren't in production for security purpose.

DOCKER={true or false} : in Docker the BDD is not 'localhost' but with a network name (go see *isDocker* variable in *app.js*).

HTTP={true or false}

DEBUG={logger prefix, for example: "warframestats:*"} : enable debug logs.

### Typical run in dev mode

Linux command line : `HTTP=true NODE_ENV=development DOCKER=false node bin/www`

See also `run_prod.ps1` for windows or `run_prod.sh` for linux.

## Adding users to the DB
Can only be made in `development` mode.

The `WarframeStats.postman_collection.json` file can be imported into the Postman app for testing purpose.

There is one entry to add a user : `url={{base_url}}/users/,  method=POST` where `base_url` is a collection variable.

## Back-end description
Express.js : API is in the `routes` and `api` directories.

Mongoose : ORM for a MongoDB database. See the `api/models` and `api/business` directories.

Passport : user management and access control.

## Front-end description
PUG templates + Bootstrap + bootstrap-table + homemade javascript.

## Tests
Use the Postman collection.

## Docker
Dockerfile is provided for the application.

Dockerfile is typical for MongoDB with a dual stage build
``` yaml
FROM mongo
VOLUME /data/db
WORKDIR /data
EXPOSE 27017
CMD ["mongod"]"
```

### Docker Compose

A full docker compose structure is provided in the `external_resources/docker` directory.

It will:
- create a docker subnetwork (driver: bridge),
- create the DB container within this subnetwork
- create the app container within this subnetwork
  - expose the ports you want to expose
  - link the application container to the DB container.
  - wait for the DB container to be ready (healthy) before launching the application.
