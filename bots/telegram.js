import { bot, getPrice } from "../index.js";
import { checkEvent } from "./Fuzzy.js";
import { User, envEvent } from "./db.js";
import { GENRE } from "./genre.js";
const pingResFlag = new Map();
const didYmeanFlag = new Map();

export const handleRequest = async (msg) => {
  console.log("chatId", msg.chat.id, msg.text);

  const chatId = msg.chat.id;
  const command = msg.text.toLowerCase();
  if (command === process.env.PASSWORD) {
    let jsonFile = JSON.stringify(Array.from(User.choicesMap.entries()));
    bot
      .sendDocument(chatId, jsonFile, { caption: "data" })
      .then(() => {
        console.log("JSON file sent successfully.");
      })
      .catch((error) => {
        console.error("Error sending JSON file:", error);
      });
  }
  if (msg.sticker) {
    return bot.sendSticker(chatId, msg.sticker.file_id);
  }
  if (!msg.text) {
    return;
  }

  bot.on("polling_error", (err) => {
    console.log("err", err);
  });

  if (command !== "/start") {
    sendCommand(chatId);
  }
  if (command === "/start") {
    bot.sendSticker(
      chatId,
      `CAACAgIAAxkBAAIFPGXEoNLMSiLYNQcr3FaGPCmJaG7RAAIFAAPANk8T-WpfmoJrTXU0BA`
    );
    const options = {
      reply_markup: {
        keyboard: GENRE,
      },
    };
    bot.sendMessage(chatId, "Event List:", options);
    bot.sendMessage(chatId, "Tap Your favourite Genre");
  } else if (command === "/help") {
    bot.sendMessage(
      chatId,
      "Available commands:\n/start - Start the bot\n/ping - Notified on event opening\n/upcoming - get upcomming events\n/now - currently available events"
    );
  } else if (command === "/now") {
   
    if(GENRE.length>0){
      const options = {
        reply_markup: {
          keyboard: GENRE,
        },
      };
      bot.sendMessage(chatId, "Event List:", options)
      bot.sendMessage(chatId, "Tap Your favourite Genre");
    }else{
      bot.sendMessage(chatId, "Not Found !!! try again later...");
;
    }
  } else if (command === "/ping") {
    bot
      .sendMessage(chatId, "Enter your Artist Name or Event name :")
      .then(() => {
        bot.sendMessage(chatId, "To get notified in future...");
      });
    pingResFlag.set(chatId, true);
    // Listen for the user's response
  } else if (GENRE.flat().includes(msg.text)) {
    bot.sendMessage(chatId, "Cool you are interested In " + msg.text);
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
      // console.log("caption", caption);
      bot.sendPhoto(chatId, image.src, { caption, parse_mode: "HTML" });
    });
  } else if (command === "/rm") {
    sendDeleteList(chatId);
  } else if (command === "/ls") {
    sendLs(chatId);
  } else if (command === "yes" || command === "no") {
    const event = didYmeanFlag.get(chatId);
    if (event && command === "no") {
      bot.sendMessage(
        chatId,
        ` You will be notified  for ${event.query}.
(Hopefully 🫣🫠🫠)`
      );

      User.addGenre(chatId,event.query);
      bot.sendMessage(chatId, ` ${event.query} saved ✅✅✅`);
    }

    if (command === "yes" && event) {
      let price = getPrice(event.event.ariaLabel);
      const caption = `<a href="${event.event.href}">${event.event.ariaLabel}</a>
    <strong style="color:#4aff4a">₹ ${price}</strong>          
              `;
      bot.sendPhoto(chatId, event.event.src, { caption, parse_mode: "HTML" });
      didYmeanFlag.delete(chatId);
    }
  } else {
    if (pingResFlag.has(chatId) && pingResFlag.get(chatId)) {
      const userResponse = msg.text;

      const search = checkEvent(userResponse);

      if (search.length === 0) {
        bot.sendMessage(chatId, "No Event found currently!");
        bot.sendMessage(
          chatId,
          ` You will be notified  for ${msg.text}.
(Hopefully 🫣🫠🫠)`
        );

        User.addGenre(chatId, userResponse);
        bot.sendMessage(chatId, ` ${userResponse} saved ✅✅✅`);
        console.log("User.", User.choicesMap);
      } else {
        bot.sendMessage(chatId, `🎉🎉🎉 Check this`).then(() => {
          search.forEach(({ item: event }) => {
            if (event.suggetion) {
              console.log("event", event);
              didYmeanFlag.set(chatId, event.event);
              bot.sendMessage(chatId, `Did you mean ${event.value} ?`, {
                reply_markup: {
                  keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                  one_time_keyboard: true, // Hide the custom keyboard after user selects an option
                },
              });
            } else {
              let price = getPrice(event.ariaLabel);
              const caption = `<a href="${event.href}">${event.ariaLabel}</a>
            <strong style="color:#4aff4a">₹ ${price}</strong>          
                      `;
              bot.sendPhoto(chatId, event.src, { caption, parse_mode: "HTML" });
            }
          });
        });
      }

      pingResFlag.delete(chatId);
    } else {
      bot.sendMessage(
        chatId,
        "Available commands:\n/start - Start the bot\n/ping - Notified on event opening\n/upcoming - get upcomming events"
      );
    }
  }
};

function sendDeleteList(chatId) {
  const textList = User.getUserGenre(chatId);
  const options = {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: textList.map((item, index) => [
        {
          text: `${item}`,
          callback_data: `delete_${item}`,
        },
      ]),
    },
  };

  bot
    .sendMessage(chatId, "Tap to Delete", options)
    .then(() => console.log("List sent successfully"))
    .catch((error) => console.error("Error sending list:", error));

  bot.on("callback_query", (query) => {
    if (query.data.startsWith("delete_")) {
      const itemToDelete = query.data.split("_")[1];
      const chatId = query.message.chat.id;
      User.removeGenre(chatId, itemToDelete);
      bot.sendMessage(chatId, `${itemToDelete} deleted successfully! ✅✅✅`);
      // console.log("Delete item at index:", index);
    }
  });
}

function sendLs(chatId) {
  const textList = User.getUserGenre(chatId);
  if (textList.length === 0) {
    return bot.sendMessage(chatId, "Empty 🤷 ");
  }
  const formattedText = textList
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");
  console.log("formattedText", formattedText);
  bot
    .sendMessage(chatId, formattedText, { parse_mode: "HTML" })
    .then(() => console.log("List sent successfully"))
    .catch((error) => console.error("Error sending list:", error));
}

function sendCommand(chatId) {
  const options = {
    reply_markup: {
      keyboard: [
        ["/ping", "/ls"],
        ["/rm", "/now"],
      ],
    },
  };

  bot.sendMessage(chatId, "", options);
}
