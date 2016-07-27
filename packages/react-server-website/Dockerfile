FROM reactserver/react-server

WORKDIR /usr/src/react-server/packages/react-server-website
COPY . .

RUN npm run build-assets
RUN mkdir -p /www/data/assets
RUN cp __clientTemp/build/* /www/data/assets/

VOLUME /www/data/assets

EXPOSE 3010

CMD [ "npm", "run", "start-prod" ]
