FROM node:alpine
EXPOSE 41100/udp
CMD [ "node", "index.js" ]
WORKDIR /usr/src/app
COPY index.js package.json ./
