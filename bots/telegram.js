import moment from "moment";
import { bot, getPrice } from "../index.js";
import { checkEvent } from "./Fuzzy.js";
import fs from "fs";
import { User, addAnalytics, envEvent, pingResFlag } from "./db.js";
import { GENRE } from "./genre.js";
export const messageIds = [];
const msgIdsmap=new Map()

export const handleRequest = async (msg) => {
  const chatId = msg.chat.id;
  const command = msg.text.toLowerCase();
  let an = "an" + process.env.PASSWORD;
  if (msg.text === an) {
    console.log("dss");
    const fileStream = fs.createReadStream("./analytics.json");
    bot
      .sendDocument(chatId, fileStream, { caption: "history" })
      .catch((er) => console.log("er", er));

    return;
  }
  if (msg.text !== an) {
    if (!["/ls", "/now", "/rm", "/help", "/ping"].includes(command)) {
      let userData = {
        first_name: msg.from.first_name,
        last_name: msg.from.last_name,
        text: msg.text,
        time: moment().format("lll"),
      };
      addAnalytics(userData);
    }
  }

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

  if (["/start", "/help", "/now", "/ls", "/rm"].some((it) => it === command)) {
    if (pingResFlag.has(chatId)) {
      pingResFlag.del(chatId);
    }
  }
  if (command === "/start") {
    start(chatId);
  } else if (command === "/help") {
    help(chatId);
    setTimeout(() => {
      sendCommand(chatId);
    }, 2000);
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

  bot.sendMessage(chatId, "Tap to Delete", options);

  bot.on("callback_query", (query) => {});
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
  bot.sendMessage(chatId, formattedText, { parse_mode: "HTML" });
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
    bot.sendMessage(chatId, "Not Found !!! try again within 2 mins...");
  }
}

async function ping(chatId) {
  bot.sendMessage(chatId, "Enter your Artist Name or Event name :").then(() => {
    bot.sendMessage(chatId, "To get notified in future...", {
      reply_markup: {
        remove_keyboard: true,
      },
    });
  });
  await pingResFlag.set(chatId, 1);
}

function getEvents(chatId, msg, command, head = true) {
  if (head) {
    bot.sendMessage(chatId, "Cool you are interested In " + msg.text);
  }

  sendEventsPage(chatId, 1, command);
}

function sendEventsPage(chatId, page, command) {
  let photoUrls = [];
  if (command === "all events") {
    photoUrls = envEvent.events;
  } else {
    photoUrls = envEvent.events.filter((it) => {
      return command.includes(it.genre.toLowerCase());
    });
  }
  if (photoUrls.length === 0) {
    return bot.sendMessage(chatId, "No events Found currently 🙆🙆🙆");
  }

  const pageSize = 4;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, photoUrls.length);

  const currentPageUrls = photoUrls.slice(startIndex, endIndex);

  let keyboard = [];
  
  if (page > 1) {
    keyboard.push(
      {
        text: "Previous",
        callback_data: `prev_${page - 1}_${command}_${chatId}`,
      },
    );
  }
  if (endIndex < photoUrls.length) {
    keyboard.push(
      { text: "Next", callback_data: `next_${page + 1}_${command}_${chatId}` }
    );
  }
  // console.log("keyboard:", keyboard);

  return new Promise((res, rej) => {
    bot
      .sendMediaGroup(
        chatId,
        currentPageUrls.map((image) => ({
          type: "photo",
          media: image.src,
          caption: `<a href="${image.href}">${
            image.ariaLabel
          }</a>\n<strong style="color:#4aff4a">₹ ${getPrice(
            image.ariaLabel
          )}</strong>`,
          parse_mode: "HTML",
          
        }))
      )
      .then((response) => {
        const messageIds = response.map(
          (mediaMessage) => mediaMessage.message_id
        );
        msgIdsmap.set(chatId,messageIds)
      
        
        bot.sendMessage(chatId, "Tap on images to see more..", {
          reply_markup: {
            inline_keyboard: [keyboard],
          },
        }).then(sentmsg=>{
         let prev= msgIdsmap.get(chatId)??[]
         prev.push(sentmsg.message_id)
         msgIdsmap.delete(chatId)
         msgIdsmap.set(chatId,prev)
        
        })
        res();
      })
      .catch(() => rej());
  });
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
      sendCommand(chatId);
      //  console.log("User.", User.choicesMap);
    } else {
      bot.sendMessage(chatId, `🎉🎉🎉 Check this`).then(() => {
        search.forEach(({ item: event, query }) => {
          //  console.log("event", event);
          if (event.suggetion) {
            // didYmeanFlag.set(chatId, event.event);
            bot
              .sendMessage(
                chatId,
                `"${event.event?.query}"\n\nPartial Match Found \nDid you mean  👇? 🤨🤨🤨 \n ${event.value}`,
                {
                  reply_markup: {
                    inline_keyboard: ["Yes", "No"].map((item, index) => [
                      {
                        text: `${item}`,
                        callback_data: `dec_${item}_${event.value}_${event.event?.query}_${chatId}`,
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
                messageIds.push({ messageId, key: event.value, chatId });
              })
              .catch((error) => {
                //  console.error("Error sending message:", error);
              });
          } else {
            //  console.log("eq", query);
            const price = getPrice(event.ariaLabel);
            const caption = `✅Exact Match 🎉🎉🎉\n[${query}]\n\n<a href="${event.href}">${event.ariaLabel}</a>\n<strong style="color:#4aff4a">₹ ${price}</strong>          
        \n\n`;

            bot.sendPhoto(chatId, event.src, { caption, parse_mode: "HTML" });
            User.removeGenre(chatId, query);
            sendCommand(chatId);
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

export const listenCallback = (query) => {

  if (query.data.startsWith("dec_")) {
    const shouldDelete = query.data.split("_")[1];
    const suggetion = query.data.split("_")[2];
    const userquery = query.data.split("_")[3];
    const chatId = query.data.split("_")[4];
    //  console.log("itemToDelete", itemToDelete);
    if (shouldDelete === "Yes") {
      bot.sendMessage(chatId, `Great 🎉🎉🎉`);
      pingResFlag.set(chatId, 0);
      User.removeGenre(chatId, userquery);
      pingArg(chatId, { text: suggetion });
    } else {
      User.addGenre(chatId, userquery);
      User.adDnd(chatId, userquery);
      bot.sendMessage(chatId, `Ok, You will be notified for ${userquery}`);
      // Delete the message

      let delind = messageIds.findIndex((it) => it.key === suggetion);

      if (delind >= 0)
        bot.deleteMessage(
          messageIds[delind].chatId,
          messageIds[delind].messageId
        );
    }
  }
  if (query.data.startsWith("delete_")) {
    const itemToDelete = query.data.split("_")[1];
    const chatId = query.message.chat.id;
    User.removeGenre(chatId, itemToDelete);
    bot.sendMessage(chatId, `${itemToDelete} deleted successfully! ✅✅✅`);
   
  }
  const [action, value, command, chatIdValue] = query.data.split("_");
 
  const chatId = parseInt(chatIdValue);
 

  if (action === "next" || action === "prev") {
    const page = parseInt(value);

    Promise.all(
      msgIdsmap.get(chatId).map((messageId) => {
        return bot.deleteMessage(chatId, parseInt(messageId));
      })
    ).then(() => {
      msgIdsmap.delete(chatId)
      sendEventsPage(chatId, page, command);
      bot.answerCallbackQuery(query.id);
    });
  }

  
};

export { getEvents, sendCommand, pingArg };
