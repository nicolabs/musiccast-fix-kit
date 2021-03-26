# See https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#node-gyp-alpine
FROM node:alpine as builder
## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache python make g++
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --production

FROM node:alpine
EXPOSE 41100/udp
CMD [ "node", "index.js" ]
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules/
COPY index.js package.json ./
COPY scripts/* ./scripts/
