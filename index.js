import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import cron from "node-cron";
import { handleRequest } from "./bots/telegram.js";
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

    let userQeue = await User.getAll();
    //  console.log('userQeue', userQeue)
    userQeue.forEach(([rkey, value]) => {
      let key = rkey.replace("db:", "");
      value.forEach((eveName) => {
        let userQeue = checkEvent(eveName);

        if (userQeue.length !== 0) {
          userQeue.forEach(async ({ item: event }) => {
            //  console.log("event", event);
            let dndStatus = await User.hasDnd(key, eveName);

            //  console.log("dndStatus", key, eveName, dndStatus);
            if (!event.suggetion) {
              const price = getPrice(event.ariaLabel);
              const caption = `✅Exact Match 🎉🎉🎉\n[${eveName}] \n\n<a href="${event.href}">${event.ariaLabel}</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>          
          \n\n`;
              // //  console.log("caption", caption);
              bot.sendPhoto(key, event.src, { caption, parse_mode: "HTML" });
              User.removeGenre(key, eveName);
            } else {
              if (dndStatus) return;
              const price = getPrice(event.event.event.ariaLabel);
              const caption = `🫤🫤Partial Match Found \n\n[${event.event.query}] -> [${event.value}]\n\n<a href="${event.event.event.href}">${event.event.event.ariaLabel}</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>\n Is this  what you're looking for?`;
              // //  console.log("caption", caption);
              bot
                .sendPhoto(key, event.event.event.src, {
                  caption,
                  parse_mode: "HTML",
                  reply_markup: {
                    inline_keyboard: ["Yes", "No"].map((item, index) => [
                      {
                        text: `${item}`,
                        callback_data: `dec_${item}_${event.event.query}_`,
                      },
                    ]),
                    one_time_keyboard: true,
                  },
                })
                .then((sentMessage) => {
                  // Store the message ID for later deletion if necessary
                  const messageId = sentMessage.message_id;

                  bot.on("callback_query", (query) => {
                    if (query.data.startsWith("dec_")) {
                      const shouldDelete = query.data.split("_")[1];
                      const itemToDelete = query.data.split("_")[2];
                      //  console.log("itemToDelete", itemToDelete);
                      if (shouldDelete === "Yes") {
                        bot.sendMessage(key, `Great 🎉🎉🎉`);
                        User.removeGenre(key, itemToDelete);
                      } else {
                        User.adDnd(key, itemToDelete);
                        bot.sendMessage(key, `Ok, You will be notified`);
                        // Delete the message
                        bot.deleteMessage(key, messageId);
                      }
                    }
                  });
                })
                .catch((error) => {
                  //  console.error("Error sending message:", error);
                });
            }
          });
        }
      });
    });
  } catch (error) {
    console.log("error", error);
  }
}
init();

console.log("Bot is running...");
