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
  try {
    let data = await upcomingEvents();

    envEvent.refreashEvent(data);

    let userQeue = await User.getAll();
    userQeue.forEach(([rkey, value]) => {
      let key = rkey.replace("db:", "");
      value.forEach((eveName) => {
        let userQeue = checkEvent(eveName);

        if (userQeue.length !== 0) {
          userQeue.forEach(({ item: event }) => {
            console.log("event", event.event.query);
            if (!event.suggetion) {
              const price = getPrice(event.ariaLabel);
              const caption = `✅Exact Match 🎉🎉🎉\n<a href="${event.href}">${event.ariaLabel}</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>          
          \n\n`;
              // console.log("caption", caption);
              bot.sendPhoto(key, event.src, { caption, parse_mode: "HTML" });
              User.removeGenre(key, eveName);
            } else {
              const price = getPrice(event.event.ariaLabel);
              const caption = `${
                event?.event?.query ?? ":"
              }"✔️✔️✔️ Partial Match Found  \n\n<a href="${event.event.href}">${
                event.ariaLabel
              }</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>          
          `;
              // console.log("caption", caption);
              bot.sendPhoto(key, event.event.src, { caption, parse_mode: "HTML" });
            }
          });
        }
      });
    });

    await updateGenre();
  } catch (error) {
    console.log("error", error);
  }
}
init();

console.log("Bot is running...");
