<h3 align="left">Languages and Tools:</h3>
<p align="left"> <a href="https://aws.amazon.com" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" alt="aws" width="40" height="40"/> </a> <a href="https://www.docker.com/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original-wordmark.svg" alt="docker" width="40" height="40"/> </a> <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="40" height="40"/> </a> <a href="https://nodejs.org" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original-wordmark.svg" alt="nodejs" width="40" height="40"/> </a> <a href="https://github.com/puppeteer/puppeteer" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/pptrdev/pptrdev-official.svg" alt="puppeteer" width="40" height="40"/> </a> <a href="https://redis.io" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/redis/redis-original-wordmark.svg" alt="redis" width="40" height="40"/> </a> </p>
# docker file <p align="left"> <a href="https://www.docker.com/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original-wordmark.svg" alt="docker" width="40" height="40"/> </a> </p>

```yml
FROM ghcr.io/puppeteer/puppeteer:21.7.0
USER root

ENV PUPPETEER*SKIP_CHROMIUM_DOWNLOAD=true \
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
LINK=https://insider.in/all-events-in-kolkata \
GENRE_CLASSNAME=css-1fv8emw \
TG_BOT_TOKEN=<Your Telegram Token> \
CRON_INTERVAL="0 */4 \_ \* \*" \
PASSWORD=admin_password \
REDIS_HOST=redis \
REDIS_PORT=6379

WORKDIR /home/app

COPY package\*.json ./

RUN npm install --quiet

COPY . .

CMD ["node", "index.js"]
```

# docker-compose.yml file

```yaml
version: "3.8"

services:
  node:
    build:
      context: .
      dockerfile: dockerfile
    depends_on:
      - redis
    network_mode: "host"

    restart: "on-failure"

  redis:
    image: redis:latest

    ports:
      - "6379:6379"
    command: redis-server --bind 0.0.0.0
```
