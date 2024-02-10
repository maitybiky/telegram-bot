# Event Notifier
https://t.me/the_event_nerd_bot


![Node.js Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1280px-Node.js_logo.svg.png)

Brief description of Node.js usage in your project.

### Puppeteer.js

![Puppeteer.js Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Puppeteer_logo.svg/1280px-Puppeteer_logo.svg.png)

Brief description of Puppeteer.js usage in your project.

### Redis

![Redis Logo](https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Redis_Logo.svg/800px-Redis_Logo.svg.png)

Brief description of Redis usage in your project.

### Docker

![Docker Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Docker_%28container_engine%29_logo.svg/1280px-Docker_%28container_engine%29_logo.svg.png)
# docker file

<p align="left"> <a href="https://www.docker.com/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original-wordmark.svg" alt="docker" width="40" height="40"/> </a> </p>

FROM ghcr.io/puppeteer/puppeteer:21.7.0

ENV PUPPETEER*SKIP_CHROMIUM_DOWNLOAD=true \
 PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
 LINK=https://insider.in/all-events-in-kolkata \
 GENRE_CLASSNAME=css-1fv8emw \
 TG_BOT_TOKEN=<TELEGRAM_BOT_TOKEN> \
 CRON_INTERVAL="0 */4 \_ \* \*"

WORKDIR /home/app

COPY package.json package-lock.json\* ./

RUN npm install

COPY . .

CMD ["node", "index.js"]
