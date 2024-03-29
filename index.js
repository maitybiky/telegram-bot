import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import cron from "node-cron";
import { handleRequest, listenCallback, messageIds } from "./bots/telegram.js";
import { User, envEvent } from "./bots/db.js";
import { upcomingEvents } from "./bots/crawler.js";
import { checkEvent } from "./bots/Fuzzy.js";

export const getPrice = (text) => {
  let txt_arr = text.split(" ");
  let ind = txt_arr.findIndex((it) => it === "activate");
  return txt_arr[ind + 1];
};
dotenv.config();

export const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });

bot.on("message", handleRequest);
bot.on("callback_query", listenCallback);

cron.schedule(
  process.env.CRON_INTERVAL,
  () => {
    //  console.log("auto calling at 2 minutes");
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

    const userQeue = await User.getAll();
    //  console.log('userQeue', userQeue)
    userQeue.forEach(([rkey, value]) => {
      let key = rkey.replace("db:", "");
      value.forEach((eveName) => {
        let eventQeue = checkEvent(eveName);

        if (eventQeue.length !== 0) {
          eventQeue.forEach(async ({ item: event }) => {
            //  console.log("event", event);
            let dndStatus = await User.hasDnd(key, eveName);

            //  console.log("dndStatus", key, eveName, dndStatus);
            if (!event.suggetion) {
              const price = getPrice(event.ariaLabel);
              const caption = `✅Exact Match 🎉🎉🎉\n[${eveName}] \n\n<a href="${event.href}">${event.ariaLabel}</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>          
          \n\n`;
              // //  console.log("caption", caption);
              bot
                .sendPhoto(key, event.src, { caption, parse_mode: "HTML" })
                .then(() => {
                  User.removeGenre(key, eveName);
                });
            } else {
              if (dndStatus) return;
              const price = getPrice(event.event.event.ariaLabel);
              const caption = `🫤🫤Partial Match Found \n\n[${event.event.query}] -> [${event.value}]\n\n<a href="${event.event.event.href}">${event.event.event.ariaLabel}</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>\n Is this  what you're looking for?`;
              
              bot
                .sendPhoto(key, event.event.event.src, {
                  caption,
                  parse_mode: "HTML",
                  reply_markup: {
                    inline_keyboard: ["Yes", "No"].map((item, index) => [
                      {
                        text: `${item}`,
                        callback_data: `dec_${item}_${event.value}_${event.event.query}_${key}`,
                      },
                    ]),
                    one_time_keyboard: true,
                  },
                })
                .then((sentMsg) => {
                  messageIds.push({
                    messageId: sentMsg.message_id,
                    key: event.value,
                    chatId: key,
                  });
                });
            }
          });
        }
      });
    });
  } catch (error) {
    console.log('error', error)
    setTimeout(() => {
      init();
    }, 300 * 1000);
  }
}
init();

console.log("Bot is running...");
