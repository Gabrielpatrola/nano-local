FROM node:16-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache git

RUN git clone https://github.com/running-coder/nanolooker.git
WORKDIR /usr/src/app/nanolooker

# Build-arg order MUST match nl_parse_config.set_nanolooker_compose (indices 0–3)
ARG REMOTE_ADDRESS="127.0.0.1"
ARG MONGO_CONTAINER="nanolooker_mongo"
ARG MONGO_PORT="27017"
RUN sed -i "s/localhost:27017/${MONGO_CONTAINER}:${MONGO_PORT}/g" ./server/constants.js

# redis npm v4 moved host/port inside socket:{} — patch before install
RUN node -e 'var fs=require(`fs`),p=`./server/client/redis.js`,c=fs.readFileSync(p,`utf8`);c=c.replace(`...(NODE_ENV === "development" ? { port: DEV_REDIS_PORT } : { port: PROD_REDIS_PORT }),\n  host: REDIS_HOST,`,`socket: { host: REDIS_HOST, port: NODE_ENV === "development" ? Number(DEV_REDIS_PORT) : Number(PROD_REDIS_PORT) },`);fs.writeFileSync(p,c);'

RUN npm install
RUN npm run build

ARG REMOTE_ADDRESS="127.0.0.1"
ARG NODE_WEBSOCKET_PORT="47000"
RUN cd dist && sed -i "s/wss:\/\/www.nanolooker.com\/ws/ws:\/\/${REMOTE_ADDRESS}:${NODE_WEBSOCKET_PORT}/g" $(grep -rl wss://www.nanolooker.com/ws ./)

EXPOSE 3010
CMD [ "npm", "run", "start:server" ]
