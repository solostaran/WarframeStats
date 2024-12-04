FROM node:23.3.0-alpine
LABEL authors="JRD"

WORKDIR /home/node/app
COPY "package*.json" ./
RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python
RUN npm install -g npm@10.9.0
RUN npm install --production
COPY . .

RUN chown -R node /home/node/app
USER node

EXPOSE 3000

CMD ["npm", "start"]


