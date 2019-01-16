FROM node:6-alpine
MAINTAINER Atlassian Labs "https://botlab.hipch.at"
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install

COPY . /usr/src/app

EXPOSE 3024
ENV MONGOHQ_URL mongodb://localhost:27017/karma
CMD node --harmony /src/web.js

