# Introduction
The Docker Compose file in this directory enables launching the
constellation of services in a way that is very similar to how we
deploy in production.

# Usage
There are a few tricky points in order to use this.

## Making Slackin Work
First, if you do not have a valid token in the `SLACK_API_TOKEN`
environment variable when bringing up the services the slackin service
will exit quickly. When NGINX tries to start it will fail because the
link to the slackin service will not work. This will, in turn, cause
NGINX to fail to start, and then you won't have anything useful
running.

Solution: follow the instructions on getting a Slack API key at
https://github.com/rauchg/slackin. You may not end up with an
administrator token, which Slackin needs to work properly, but the
service will still run.

## Using the Development Slackin
Once you get the services running, you won't be able to use the local
Slackin service unless you update your /etc/hosts file to have
"slack.react-server.io" on the 127.0.0.1 line.

You don't need to do this unless you are trying to test the Slackin service
locally.

## Launching
Once you have worked out the details above you can launch the services
with Docker Compose. You will need Docker Engine and Docker Compose
installed on your machine for this to work.

Steps:

1. Build the reactserver/react-server Docker image if it is not up to
date. Note: I usually do this in a clean repository. From the root of
the repository do: `docker build -t reactserver/react-server .`
1. Launch the services using the docker-compose.yml file. From inside
of this directory do: `SLACK_API_TOKEN=YOUR_SLACK_TOKEN docker-compose
up --build -d`.

Now you can navigate to
[http://localhost:8443](http://localhost:8443). Going to port 8443 is
important. If you go to port 8080 NGINX will redirect you to
https://react-server.io, and then you won't be looking at your
development service. You could avoid this if you put react-server.io
on the 127.0.0.1 line of your /etc/hosts.

## Iterating
A pitfall to avoid when iterating is the docs service volume
persisting. If the volume is not removed, the JS and CSS assets served
by NGINX will not update when you launch an updated version of the
docs service.

When removing a container, Docker only removes associated anonymous
volumes when explicitly asked. You want to explicitly ask.

Here is your workflow if you are modifying the docs service:
```
docker-compose stop docs && docker-compose rm -vf docs
SLACK_API_TOKEN=YOUR_SLACK_TOKEN docker-compose up --build -d
```
