import { bot, getPrice } from "../index.js";
import { checkEvent } from "./Fuzzy.js";
import { User, didYmeanFlag, envEvent, pingResFlag } from "./db.js";
import { GENRE } from "./genre.js";

export const handleRequest = async (msg) => {
  const chatId = msg.chat.id;
  const command = msg.text.toLowerCase();
  //  console.log("first", command, chatId);
  if (command === process.env.PASSWORD) {
    let userQeue = await User.getAll();
    userQeue.forEach(([key, value]) => {
      bot.sendMessage(chatId, `${key}\n${value.join(",")}`);
    });

    return;
  }
  if (msg.sticker) {
    return bot.sendSticker(chatId, msg.sticker.file_id);
  }
  if (!msg.text) {
    return;
  }

  bot.on("polling_error", (err) => {
    //  console.log("err", err);
  });

  if (command !== "/start" && command !== "/ping" && command !== "/now") {
    setTimeout(() => {
      sendCommand(chatId);
    }, 2000);
  }
  if (command === "/start") {
    start(chatId);
  } else if (command === "/help") {
    help(chatId);
  } else if (command === "/now") {
    now(chatId);
  } else if (command === "/ping") {
    ping(chatId);
  } else if (GENRE.flat().includes(msg.text)) {
    getEvents(chatId, msg, command);
  } else if (command === "/rm") {
    sendDeleteList(chatId);
  } else if (command === "/ls") {
    //  console.log("ls", chatId);
    sendLs(chatId);
  } else if (command === "yes" || command === "no") {
    didYouMean(chatId, command);
  } else {
    pingArg(chatId, msg);
  }
};

async function sendDeleteList(chatId) {
  const textList = await User.getUserGenre(chatId);
  const options = {
    parse_mode: "HTML",

    reply_markup: {
      inline_keyboard: textList.map((item, index) => [
        {
          text: `${item}`,
          callback_data: `delete_${item}`,
        },
      ]),
      one_time_keyboard: true,
    },
  };

  bot
    .sendMessage(chatId, "Tap to Delete", options)
    

  bot.on("callback_query", (query) => {
    if (query.data.startsWith("delete_")) {
      const itemToDelete = query.data.split("_")[1];
      const chatId = query.message.chat.id;
      User.removeGenre(chatId, itemToDelete);
      bot.sendMessage(chatId, `${itemToDelete} deleted successfully! ✅✅✅`);
      // //  console.log("Delete item at index:", index);
    }
  });
}

async function sendLs(chatId) {
  const textList = await User.getUserGenre(chatId);

  if (textList.length === 0) {
    return bot.sendMessage(chatId, "Empty 🤷 ");
  }
  const formattedText = textList
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");
  //  console.log("formattedText", formattedText);
  bot
    .sendMessage(chatId, formattedText, { parse_mode: "HTML" })
}

function sendCommand(chatId) {
  const options = {
    reply_markup: {
      keyboard: [["/ping", "/ls"], ["/rm", "/now"], ["/help"]],
    },
  };

  bot.sendMessage(chatId, "/>", options);
}
// command functions
function start(chatId) {
  bot.sendSticker(
    chatId,
    `CAACAgIAAxkBAAIFPGXEoNLMSiLYNQcr3FaGPCmJaG7RAAIFAAPANk8T-WpfmoJrTXU0BA`
  );
  sendCommand(chatId);
}

function help(chatId) {
  bot.sendMessage(
    chatId,
    "Available commands:\n/start - Start the bot\n\n/ping - Notified on event opening(set alarm)\n\n/now - currently available events\n/ls - get your alarms\n\n/rm - delete alarms"
  );
}

function now(chatId) {
  if (GENRE.length > 0) {
    const options = {
      reply_markup: {
        keyboard: GENRE,
      },
    };
    bot.sendMessage(chatId, "Event List:", options);
    bot.sendMessage(chatId, "Tap Your favourite Genre");
  } else {
    bot.sendMessage(chatId, "Not Found !!! try again after 2 mins...");
  }
}

async function ping(chatId) {
  bot.sendMessage(chatId, "Enter your Artist Name or Event name :").then(() => {
    bot.sendMessage(chatId, "To get notified in future...");
  });
  await pingResFlag.set(chatId, 1);
}

function getEvents(chatId, msg, command, head = true) {
  if (head) {
    bot.sendMessage(chatId, "Cool you are interested In " + msg.text);
  }
  let filterGenre;
  if (msg.text === "All Events") {
    filterGenre = envEvent.events;
  } else {
    filterGenre = envEvent.events.filter((it) => {
      return command.includes(it.genre.toLowerCase());
    });
  }
  if (filterGenre.length === 0) {
    bot.sendMessage(chatId, "No events Found currently 🙆🙆🙆");
  }
  filterGenre.forEach((image) => {
    let price = getPrice(image.ariaLabel);
    const caption = `<a href="${image.href}">${image.ariaLabel}</a>
    <strong style="color:#4aff4a">₹ ${price}</strong>          
              `;
    // //  console.log("caption", caption);
    bot.sendPhoto(chatId, image.src, { caption, parse_mode: "HTML" });
  });
}

function didYouMean(chatId, command) {
  const event = didYmeanFlag.get(chatId);
  if (event && command === "no") {
    bot.sendMessage(
      chatId,
      ` You will be notified  for ${event.query}.\n(Hopefully 🫣🫠🫠)`
    );

    User.addGenre(chatId, event.query);
    bot.sendMessage(chatId, ` ${event.query} saved ✅✅✅`);
  }

  if (command === "yes" && event) {
    let price = getPrice(event.event.ariaLabel);
    const caption = `<a href="${event.event.href}">${event.event.ariaLabel}</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>`;
    bot.sendPhoto(chatId, event.event.src, { caption, parse_mode: "HTML" });
    didYmeanFlag.delete(chatId);
  }
}

async function pingArg(chatId, msg) {
  let isExistFlag = await pingResFlag.has(chatId);
  let flagStatus = await pingResFlag.get(chatId);
  if (isExistFlag && flagStatus) {
    const userResponse = msg.text;
    //  console.log("chatId", chatId);
    const search = checkEvent(userResponse);
    //  console.log("search", search);
    if (search.length === 0) {
      bot.sendMessage(chatId, "No Event found currently!");
      bot.sendMessage(
        chatId,
        ` You will be notified  for ${msg.text}.\n (Hopefully 🙈😅🫠)`
      );

      User.addGenre(chatId, userResponse);
      bot.sendMessage(chatId, ` ${userResponse} saved ✅✅✅`);
      //  console.log("User.", User.choicesMap);
    } else {
      bot.sendMessage(chatId, `🎉🎉🎉 Check this`).then(() => {
        search.forEach(({ item: event, query }) => {
          //  console.log("event", event);
          if (event.suggetion) {
            didYmeanFlag.set(chatId, event.event.event.query);
            bot
              .sendMessage(
                chatId,
                `"${event.event?.query}"\n\nPartial Match Found \nDid you mean  👇? 🤨🤨🤨 \n ${event.value}`,
                {
                  reply_markup: {
                    inline_keyboard: ["Yes", "No"].map((item, index) => [
                      {
                        text: `${item}`,
                        callback_data: `dec_${item}_${event.value}_`,
                      },
                    ]),
                    one_time_keyboard: true,
                    resize_keyboard: true,
                  },
                }
              )
              .then((sentMessage) => {
                // Store the message ID for later deletion if necessary
                const messageId = sentMessage.message_id;

                bot.on("callback_query", (query) => {
                  if (query.data.startsWith("dec_")) {
                    const shouldDelete = query.data.split("_")[1];
                    const itemToDelete = query.data.split("_")[2];
                    //  console.log("itemToDelete", itemToDelete);
                    if (shouldDelete === "Yes") {
                      bot.sendMessage(chatId, `Great 🎉🎉🎉`);
                      pingResFlag.set(chatId, 1);
                      pingArg(chatId, { text: itemToDelete });
                      User.removeGenre(chatId, itemToDelete);
                    } else {
                      User.adDnd(chatId, itemToDelete);
                      bot.sendMessage(chatId, `Ok, You will be notified`);
                      // Delete the message
                      bot.deleteMessage(chatId, messageId);
                    }
                  }
                });
              })
              .catch((error) => {
                //  console.error("Error sending message:", error);
              });
          } else {
            //  console.log("eq", query);
            const price = getPrice(event.ariaLabel);
            const caption = `✅Exact Match 🎉🎉🎉\n[${query}]\n\n<a href="${event.href}">${event.ariaLabel}</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>          
        \n\n`;
            // //  console.log("caption", caption);
            bot.sendPhoto(chatId, event.src, { caption, parse_mode: "HTML" });
            User.removeGenre(chatId, query);
          }
        });
      });
    }

    await pingResFlag.del(chatId);
  } else {
    bot.sendMessage(
      chatId,
      "Available commands:\n/start - Start the bot\n/ping - Notified on event opening(set alarm)\n/now - currently available events\n/ls - get your alarms\n/rm - delete alarms"
    );
  }
}

export { getEvents };
