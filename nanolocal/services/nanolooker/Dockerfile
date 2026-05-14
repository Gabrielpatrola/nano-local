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
RUN node -e 'var fs=require(`fs`),p=`./server/client/redis.js`,c=fs.readFileSync(p,`utf8`),n=c.replace(/\.\.\.\(NODE_ENV[\s\S]*?PROD_REDIS_PORT \}\),\n\s*host: REDIS_HOST,/,`socket: { host: REDIS_HOST, port: NODE_ENV === "development" ? Number(DEV_REDIS_PORT) : Number(PROD_REDIS_PORT) },`);if(n===c){console.error("PATCH FAILED: redis v4 socket pattern not found");process.exit(1);}fs.writeFileSync(p,n);'

RUN npm install

# nodeStatus.js uses find-process to locate nano_node in the same OS — impossible across
# Docker containers. Replace it with a direct fs.statSync on NODE_FOLDER/data.ldb.
COPY ./services/nanolooker/nodeStatus.js ./server/api/nodeStatus.js

RUN npm run build

ARG REMOTE_ADDRESS="127.0.0.1"
ARG NODE_WEBSOCKET_PORT="47000"
ARG INTERNAL_WS_URI="ws://localhost:17078"
# Patch client bundle (uses external-facing address)
RUN cd dist && sed -i "s|wss://www.nanolooker.com/ws|ws://${REMOTE_ADDRESS}:${NODE_WEBSOCKET_PORT}|g" $(grep -rl wss://www.nanolooker.com/ws ./)
# ws/index.js builds the URL as: `wss://www.nanolooker.com/ws:${process.env.WS_PORT}`
# Replace the whole expression (base URL + port var) with the internal URI
RUN sed -i "s|wss://www.nanolooker.com/ws:[$][{]process[.]env[.]WS_PORT[}]|${INTERNAL_WS_URI}|g" ./server/ws/index.js
# Replace any remaining occurrences in other server files
RUN grep -rl "wss://www.nanolooker.com/ws" ./server/ | xargs -r sed -i "s|wss://www.nanolooker.com/ws|${INTERNAL_WS_URI}|g"
# Patch client bundle API base URL (frontend calls hardcoded production API; make relative)
RUN cd dist && grep -rl 'nanolooker.com/api' ./ | xargs -r sed -i 's|https://www.nanolooker.com/api|/api|g'

EXPOSE 3010
CMD [ "npm", "run", "start:server" ]
