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

Or `npm run dev`

## Adding users to the DB
The API has no sign-up route : a user is created with a script that needs access to the database.

`node resources/scripts/CreateUser.js <email>` asks the password twice (without echo). An existing email is refused. `MONGO_URI` sets the database (default : `mongodb://127.0.0.1/WarframeStatsDB`).

Without Node on the host, in the Docker Compose stack: `resources/compose/create_user_host_script.sh <email> [--dev]` runs the same script in the application image, on the compose network (`--dev`: the stack of `docker-compose.dev.yml`, default: `docker-compose.yml`). A running database is used as is, the application keeps running; a stopped database is started, then stopped again.

The `resources/misc/WarframeStats.postman_collection.json` file can be imported into the Postman app for testing purpose.

## Back-end description
Express.js : the JSON API is in the `api` directory (`routes`, `domain`, `models`), the server side of the pages in the `web` directory.

Mongoose : ORM for a MongoDB database. See the `api/models` and `api/domain` directories, and `database/migrations`.

Authentication and security : the `security` directory.

Passport : user management and access control.

## Front-end description
PUG templates + Bootstrap + bootstrap-table + homemade javascript.

## Tests
Use the Postman collection, or use `npm run test` (unit and integration tests).

## Docker
Dockerfile is provided for the application. A dual stage with build and production stages on a node image.

### Docker Compose

A full docker compose structure is provided in the `resources/compose` directory.

It will:
- create a docker subnetwork (driver: bridge),
- create the DB container within this subnetwork
- create the app container within this subnetwork
  - expose the ports you want to expose
  - link the application container to the DB container.
  - wait for the DB container to be ready (healthy) before launching the application.

### First start: seed the database
A new installation has an empty database: the application asks to restore a backup and nobody can log in.
`resources/compose/seed_warstats_host_script.sh` initializes it once, with Docker only (no Node on the host): the scripts run in the application image, on the compose network, and the database port is never published.

Prerequisites:
- the git repository (the default data is in `resources/seed/WarframeStatsDB`, one Extended JSON file per collection),
- run it as the host user that runs the containers, the `user` of the compose file of that host (`1000:1000` in `docker-compose.dev.yml`, `1002:1002` in `docker-compose.yml`): the database is seeded as that user (`WARSTATS_USER`, set by the script only),
- an empty `resources/compose/db-warstats/data-volume` owned by that user (the script refuses any other).

```bash
resources/compose/seed_warstats_host_script.sh <email>
```

1. starts the database alone (`docker-compose.yml`, the production configuration),
2. creates the user `<email>` (`resources/scripts/CreateUser.js`, the password is asked twice),
3. inserts the default data (`resources/scripts/SeedDatabase.js`): the reward, riven, booster, netracell and Temporal Archimedea types and sources, the riven conditions and the schema version. A collection that already has documents is skipped, so a second run inserts nothing,
4. stops the database, even when a step fails (its data stays in `db-warstats/data-volume`).

### Start the application with compose
#### Development
Using the `docker-compose.dev.yml`
```bash
resources/compose/run_dev.sh     # development (docker-compose.dev.yml)
```

#### Production
```bash
docker compose -f resources/compose/docker-compose.yml up -d
```
