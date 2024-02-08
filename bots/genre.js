import Puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();
export var GENRE = [
  ["All Events", "Music (34)"],
  ["Food and Drink (7)", "Comedy (6)"],
  ["Kabaddi (6)", "Self Improvement (4)"],
  ["Art (3)", "Experiences (3)"],
  ["Theatre (3)", "Conference (2)"],
  ["Date Meet (2)", "Food and Music Festival (2)"],
  ["Holi Party (2)", "Live Event (2)"],
  ["Runathon (2)", "Adventure (1)"],
  ["Brunch (1)", "Courses (1)"],
  ["Dance (1)", "Dance and Music (1)"],
  ["Dinner (1)", "Drama (1)"],
  ["Events & Workshops (1)", "Food (1)"],
  ["Food Fest (1)", "Free Events (1)"],
  ["Gaming and Entertainment (1)", "Literature (1)"],
  ["Marathon (1)", "NY Parties 2024 (1)"],
  ["Other (1)", "Parties (1)"],
  ["Pocket Friendly (1)", "Run (1)"],
  ["Skill Development (1)", "Storytelling (1)"],
  ["Table Tennis (1)", "Workshops (1)"],
  ["Yoga (1)"],
];

export const updateGenre = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await Puppeteer.launch({
        headless: "new",
        executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      });

      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(120000);
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(`https://insider.in/all-events-in-kolkata`);

      const genres = await page.$$(
        `.${process.env.GENRE_CLASSNAME ?? "css-1fv8emw"}`
      );

      let rewData = [];
      for (const genre of genres) {
        const textContent = await page.evaluate((el) => el.textContent, genre);
        rewData.push(textContent);
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
      await browser.close();
      resolve(rewData);
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  });
};
