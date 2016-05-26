# react-server-examples/bike-share

An example project for `react-server` which demos server rendering, interactivity
on the client side, frameback, ReactServerAgent, url parameters and logging.
Uses [api.citybik.es](http://api.citybik.es/v2/) to get data about bike shares
and their availability around the world.

To start in development mode:

```shell
npm start
```

Then go to [localhost:3000](http://localhost:3000/). You will see an index page
that shows the covered bike share networks around the world.  Each bike share
network is a link to a details page that, when clicked, loads an iframe in front
of the index page containing a network page for that bike share network,
including information about each station in that network, and the number of
available bikes the last time that data is available for.

If you want to optimize the client code at the expense of startup time, type
`NODE_ENV=production npm start`. You can also use
[any react-server-cli arguments](../../react-server-cli#setting-options-manually)
after `--`. For example:

```shell
# start in dev mode on port 4000
npm start -- --port=4000
```

# Developing using Docker and Docker Compose

These steps assume you are familiar with docker and already have it installed.
Some basics:

1. Download [Docker Toolbox](https://www.docker.com/products/docker-toolbox) and
    install it.
2. Start `docker quick start shell`
3. Navigate to where you generated the project
4. Add a configuration to set the `host` option to the ip given by
    `docker-machine ip`. An example configuration might be like:
```json
{
  "port": "3000",
  "env": {
    "docker": {
      "host": "Your ip from `docker-machine ip` here"
    },
    "staging": {
      "port": "3000"
    },
    "production": {
      "port": "80"
    }
  }
}
```
5. Now that your system is ready to go, start the containers:
```shell
docker-compose build --pull
docker-compose up
```

The containers will now be running. At any time, press ctrl+c to stop them.

To clean up, run the following commands:

```shell
docker-compose stop
docker-compose rm --all
docker volume ls # and get the name of the volume ending in react_server_node_modules
# this name will be different depending on the name of the project
docker volume rm _react_server_node_modules
```

The configuration included stores the node_modules directory in a "named volume".
This is a special persistent data-store that Docker uses to keep around the
node_modules directory so that they don't have to be built on each run of the
container. If you need to get into the container in order to investigate what
is in the volume, you can run `docker-compose exec react_server bash` which will
open a shell in the container. Be aware that the exec functionality doesn't
exist in Windows (as of this writing).
