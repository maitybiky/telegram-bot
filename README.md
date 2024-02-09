# Event Notifier

# docker file

<i class="fa fa-docker"></i>

FROM ghcr.io/puppeteer/puppeteer:21.7.0

ENV PUPPETEER*SKIP_CHROMIUM_DOWNLOAD=true \
 PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
 LINK=https://insider.in/all-events-in-kolkata \
 GENRE_CLASSNAME=css-1fv8emw \
 TG_BOT_TOKEN=<TELEGRAM_BOT_TOKEN> \
 CRON_INTERVAL="0 */4 \_ \* \*"

WORKDIR /home/app

RUN npm install

COPY package.json package-lock.json\* ./

COPY . .

CMD ["node", "index.js"]
