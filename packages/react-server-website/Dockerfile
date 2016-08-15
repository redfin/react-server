FROM reactserver/react-server

WORKDIR /usr/src/react-server/packages/react-server-website
COPY . .

RUN npm run build-assets
RUN mkdir -p /www/assets
RUN cp __clientTemp/build/* /www/assets/
RUN cp favicon.ico /www/

VOLUME /www

EXPOSE 3010

CMD [ "npm", "run", "start-prod" ]
