import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import cron from "node-cron";
import { handleRequest } from "./bots/telegram.js";
import { User, envEvent } from "./bots/db.js";
import { upcomingEvents } from "./bots/crawler.js";
import { updateGenre } from "./bots/genre.js";
import { checkEvent } from "./bots/Fuzzy.js";
export const getPrice = (text) => {
  let txt_arr = text.split(" ");
  let ind = txt_arr.findIndex((it) => it === "activate");
  return txt_arr[ind + 1];
};
dotenv.config();

export const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });

bot.on("message", handleRequest);
console.log("CRON_INTERVAL", process.env.CRON_INTERVAL);
console.log("TG_BOT_TOKEN", process.env.TG_BOT_TOKEN);
cron.schedule(
  process.env.CRON_INTERVAL,
  () => {
    console.log("auto calling at 2 minutes");
    init();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata", // Adjust the timezone as per your requirement
  }
);
async function init() {
  console.log("getting events");

  let data = await upcomingEvents();

  envEvent.refreashEvent(data);

  console.log("got it");
  console.log("updating genre");

  console.log("genre updated");
  console.log("broadcasting");
  console.log("User", User.choicesMap);
  User.choicesMap.forEach((value, key) => {
    value.forEach((eveName) => {
      let userQeue = checkEvent(eveName);
      console.log("userQueue", userQeue);
      if (userQeue.length !== 0) {
        userQeue.forEach(({ item: event }) => {
          if (!event.suggetion) {
            const price = getPrice(event.ariaLabel);
            const caption = `<a href="${event.href}">${event.ariaLabel}</a>
<strong style="color:#4aff4a">₹ ${price}</strong>          
          `;
            // console.log("caption", caption);
            bot.sendPhoto(key, event.src, { caption, parse_mode: "HTML" });
            User.removeGenre(key, eveName);
          }
        });
        console.log('U', User.choicesMap)
      }
    });
  });
  console.log("User@", User.choicesMap);

  await updateGenre();
}
init();
console.log("Bot is running...");
