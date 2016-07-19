FROM node:6.3.0

WORKDIR /usr/src/
RUN git clone https://github.com/redfin/react-server.git
WORKDIR /usr/src/react-server
RUN git checkout hackathon-website

RUN npm run bootstrap

WORKDIR /usr/src/react-server/packages/react-server-website

EXPOSE 3010
EXPOSE 3011

CMD [ "npm", "start" ]