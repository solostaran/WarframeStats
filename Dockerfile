# alpine is a small container (alternative :latest)
FROM node:alpine

# create app directory
WORKDIR /usr/WarframeStats

# ENV
ENV NODE_ENV production
ENV DOCKER true

# copy npm and install dependencies
COPY package*.json ./
RUN npm install

# copy sources
COPY . .

# port binding
EXPOSE 443

# Start the server
CMD [ "npm", "start" ]

