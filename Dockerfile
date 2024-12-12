######### BASE STAGE

FROM node:23.3.0-alpine AS base
LABEL authors="JRD"

RUN apk -U upgrade

######### BUILD STAGE

FROM base AS build

RUN apk add git

WORKDIR /home/node
#COPY "package*.json" ./
RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python
RUN npm install -g npm@10.9.0
RUN git clone https://github.com/solostaran/WarframeStats.git
WORKDIR /home/node/WarframeStats
RUN npm install --production

######### PRODUCTION STAGE

FROM base AS prod

RUN apk add curl

COPY --from=build /home/node/WarframeStats /home/node/WarframeStats
WORKDIR /home/node/WarframeStats
RUN chown -R node /home/node/WarframeStats
USER node

EXPOSE 3000

ENV DEBUG=warframestats:*
ENV NODE_ENV=production
ENV DOCKER=true
ENV HTTP=true

CMD ["node", "bin/www"]
