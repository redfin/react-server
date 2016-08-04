# react-server-examples/hello-world

Very simple example project for `react-server` which only shows server rendering
and interactivity on the client side.

To start in development mode:

```shell
npm start
```

Then go to [localhost:3000](http://localhost:3000/). You will see a simple page
that pre-renders and that is interactive on load. It also will include hot
reloading of React components in their own file.

If you want to optimize the client code at the expense of startup time, type
`NODE_ENV=production npm start`. You can also use any
[react-server-cli arguments](../../react-server-cli#setting-options-manually)
after `--`. For example:

```shell
# start in dev mode on port 4000
npm start -- --port=4000
```

# Running the tests

To run the tests

```shell
npm test
```

There are three tests called by the testing target; to run them independently
you'll likely want to install some dependencies globally

```shell
npm i -g eslint eslint-plugin-react babel-eslint ava nsp
```

The first test is a linter, which checks for common bugs and code style; you can
run it with `eslint <file-or-directory>`.

The second test is a security auditing test, which checks for known security
issues with the installed dependencies; you can run it with `nsp check`.

The last test is an end-to-end test, which starts the server and checks that it
serves pages correctly; you can run it with `ava test.js`.

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
