import Puppeteer from "puppeteer";
import dotenv from "dotenv";
import Fuse from "fuse.js";

dotenv.config();
export var GENRE = [];

export const updateGenre = async (page) => {
  return new Promise(async (resolve, reject) => {
    try {
      page.setDefaultNavigationTimeout(120000);
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(`https://insider.in/all-events-in-kolkata`);

      const genres = await page.$$(
        `.${process.env.GENRE_CLASSNAME ?? "css-1fv8emw"}`
      );
      console.log("updating genre");
      let rewData = [];
      for (const genre of genres) {
        const textContent = await page.evaluate((el) => el.textContent, genre);
        let eventTxt = `${getEmoji(textContent)}${textContent}`;
        rewData.push(eventTxt);
      }
      const formated = [];
      for (let ind = 0; ind < rewData.length; ind += 2) {
        if (ind % 2 === 0) {
          if (rewData[ind] && rewData[ind + 1]) {
            formated.push([rewData[ind], rewData[ind + 1]]);
          } else if (rewData[ind]) {
            formated.push([rewData[ind]]);
          }
        }
      }
      GENRE = formated;

      resolve(rewData);
    } catch (error) {
      console.log("errorupdategenre", error);
      throw error;
    }
  });
};

function getEmoji(caseToMatch) {
  let str = caseToMatch.split("(")[0];
  const cases = [
    { case: "music", emoji: "🎶" },
    { case: "course", emoji: "🎓" },
    { case: "run", emoji: "🏃" },
    { case: "food", emoji: "🍜" },
    { case: "comedy", emoji: "🤪" },
    { case: "kabaddi", emoji: "🤼" },
    { case: "self improvement", emoji: "📖" },
    { case: "experience", emoji: "🎭" },
    { case: "party", emoji: "🥂 " },
    { case: "art", emoji: "🎨" },
    { case: "conference", emoji: "🤝" },
    { case: "runathon", emoji: "🏃" },
    { case: "dance", emoji: "🕺💃" },
    { case: "date meet", emoji: "💑" },
    { case: "free", emoji: "🆓" },

    { case: "live", emoji: "🆓" },
    { case: "adventure", emoji: "⛺" },
    { case: "theatre", emoji: "🎬" },
    { case: "dinner", emoji: "🍽️" },
    { case: "drama", emoji: "🎭" },
    { case: "gaming", emoji: "🎮" },
    { case: "yoga", emoji: "🧘" },
    { case: "pocket friendly", emoji: "🏷️" },
  ];

  const foundCase = cases.find((item) =>
    str.toLowerCase().includes(item.case.toLocaleLowerCase())
  );
  return foundCase ? foundCase.emoji : "";
}
