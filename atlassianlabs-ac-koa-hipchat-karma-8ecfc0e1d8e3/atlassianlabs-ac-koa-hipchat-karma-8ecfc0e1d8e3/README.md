# Karma #
A global Hipchat add-on for adding or removing karma to people and things.

![karma.png](https://bitbucket.org/repo/AnBKL4/images/3241948271-karma.png)

## [Install Me on Hipchat Cloud](https://hipchat.com/addons/install?url=https%3A%2F%2Fac-koa-hipchat-karma.herokuapp.com%2Faddon%2Fcapabilities) ##

# Commands #
```
#!html
Usage:
  /karma                 print this help message
  /karma :enable         enable karma matching in the current room
  /karma :disable        disable karma matching in the current room
  /karma :top things     show the top 10 things
  /karma :bottom things  show the bottom 10 things
  /karma :top users      show the top 10 users
  /karma :bottom users   show the bottom 10 users
  /karma thing           lookup thing's current karma
  /karma @MentionName    lookup a user's current karma by @MentionName
  thing++                add 1 karma to thing
  thing++++              add 3 karma to thing (count(+) - 1, max 5)
  thing--                remove 1 karma from thing
  thing----              remove 3 karma from thing (count(-) - 1, max 5)
  "subject phrase"++     add 1 karma to a subject phrase
  @MentionName++         add 1 karma to a user by @MentionName
```


# Run Karma yourself with Docker #

This is an experimental way for you to run Karma yourself using Docker, which could be useful for "Behind the Firewall" (on-premises) Hipchat Data Center deployments.

This version of Karma links to persistent Mongo container which contains your
Hipchat instance installation information, and the user Karma values. If you
destroy the linked container, you'll have to uninstall and reinstall the
Dockerized version of Karma on your Hipchat deployment. (You might want to make
periodic backups of this container using `docker export`. Run the `docker
export --help` command to learn more.)

If you decide to use this in production, you'll want to use your own SSL
termination and port forwarding from the Docker host to protect your Karma
traffic. You can use a proxy such as NGINX or HAProxy for this.

If you'll be running this on a deployment without access to the internet, your process will look something like this:

1. Clone this repository.
2. Build a container from the repository.
3. Pass the container to your on-premises deployment using whatever process is approved by your organization.
4. Run the container on a host within your firewall. 
   Optionally, you may also push the image to a Docker Registry, Docker Trusted Registry, or Docker Datacenter repository.

### Setup and Prerequisites ###

1. Check for port conflicts on port 3024. 
   Karma will use this port so you want it to be available. If you have a conflict, change the PORT variable in the `docker-compose` file to something else.
2. Clone this source repository to your local machine: 
   `git clone https://bitbucket.org/atlassianlabs/ac-koa-hipchat-karma.git`

### Build the container ###

1. Change directories to the source you just cloned:
   `cd ac-koa-hipchat-karma`

2. Run the following command to use the Dockerfile in this repo to build a container with the latest version of the Karma bot.
   `sudo docker build -t atlassianlabs/karma:latest .`

### Run the Karma service ###

1. Export the following variable in your shell:
   `export BASE_URL=http://your-docker-host-fqdn:3024`

2. Run the following command to use the Docker Compose file in this repo to run the Karma service. 
   `docker-compose up -d`

3. Check the logs to make sure everything went smoothly using the following command.  
   `docker-compose logs`

4. Verify that the following URL returns a valid `capabilities.json` response. (Replace `your-docker-host-fqdn` with your actual host.)
  `http://your-docker-host-fqdn:3024/addon/capabilities`

### Install Karma on your Hipchat instance ###
Next, make your Dockerized version of Karma available on your Hipchat service.

> **Note:** You must be at least a room admin to install an integration in a
room. Only admins can install integrations globally.

1. Log in to your Hipchat instance.
   1. If you're using Hipchat Cloud or Hipchat Server, click the Manage tab.
   2. If you're using Hipchat Data Center, log in to the web portal and click **Add-ons** in the left navigation.
3. Click **Install an add-on from a descriptor URL**.
4. In the dialog that appears, enter the URL you used above:
   http://your-docker-host-fqdn:3024/addon/capabilities 
   Hipchat verifies the add-on capabilities, and adds it to your deployment.

### Test ###

Go to a chat room and type `/karma`! 