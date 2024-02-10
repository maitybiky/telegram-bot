import Puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();
export var GENRE = [

];

export const updateGenre = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await Puppeteer.launch({
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
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
      //  console.log("errorupdategenre", error);
      throw error;
    }
  });
};
