# alpine is a small container (alternative :latest)
FROM node:alpine

# try at upgrading (! new)
RUN apk -U upgrade

# new user and app directory (! new)
RUN addgroup -S wsgroup && adduser -S warstats -G wsgroup
WORKDIR /home/warstats
USER warstats

# create app directory (! previous dir)
#WORKDIR /usr/WarframeStats

USER root

# copy npm and install dependencies
COPY package*.json ./
RUN npm install

USER warstats

# ENV
ENV NODE_ENV production
ENV DOCKER true

# copy sources
COPY . .

# port binding
EXPOSE 443

# Start the server
CMD [ "npm", "start" ]

