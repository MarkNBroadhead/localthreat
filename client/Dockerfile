FROM node:14.9-alpine

WORKDIR /usr/local/src
ADD package*.json ./
RUN npm i --legacy-peer-deps

ADD . ./
EXPOSE 3000

CMD ["npm", "run", "start"]