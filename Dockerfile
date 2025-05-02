######### BASE STAGE

FROM node:23-alpine AS base
LABEL authors="JRD"

RUN apk -U upgrade

######### BUILD STAGE

FROM base AS build

#RUN apk add git

#WORKDIR /home/node
RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python
RUN npm install -g npm@10.9.1
WORKDIR /home/node/WarframeStats
COPY package*.json .
#RUN git clone https://github.com/solostaran/WarframeStats.git
#RUN git checkout -b develop
RUN npm install --production

######### PRODUCTION STAGE

FROM base AS prod

RUN apk add curl

COPY --from=build /home/node/WarframeStats /home/node/WarframeStats
WORKDIR /home/node/WarframeStats
COPY app.js .
COPY api/ api/
COPY bin/ bin/
COPY config/ config/
COPY public/ public/
COPY routes/ routes/
COPY views/ views/
RUN chown -R node /home/node/WarframeStats
USER node

EXPOSE 3000

ENV DEBUG=warframestats:*
ENV NODE_ENV=production
ENV DOCKER=true
ENV HTTP=true

#CMD ["ls", "/home/node/WarframeStats/api"]
CMD ["node", "bin/www"]
