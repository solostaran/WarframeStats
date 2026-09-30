######### BASE STAGE

FROM node:26-alpine3.24 AS base
LABEL authors="JRD"

RUN apk -U upgrade

######### BUILD STAGE

FROM base AS build

#RUN apk add git

#RUN npm install -g npm@11.7.0
WORKDIR /home/node/WarframeStats
COPY package*.json ./
#RUN git clone https://github.com/solostaran/WarframeStats.git
#RUN git checkout -b develop
RUN npm ci --omit=dev

######### PRODUCTION STAGE

FROM base AS prod

RUN apk add curl

WORKDIR /home/node/WarframeStats
COPY --chown=node:node --from=build /home/node/WarframeStats ./
COPY --chown=node:node app.js .
COPY --chown=node:node api/ api/
COPY --chown=node:node bin/ bin/
COPY --chown=node:node config/ config/
COPY --chown=node:node public/ public/
COPY --chown=node:node routes/ routes/
COPY --chown=node:node views/ views/
USER node

EXPOSE 3000

#ENV DEBUG=warframestats:*
#ENV NODE_ENV=production
#ENV DOCKER=true
#ENV HTTP=true

#CMD ["ls", "/home/node/WarframeStats/api"]
CMD ["node", "bin/www"]
