import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { updateGenre } from "./genre.js";

dotenv.config();
export const upcomingEvents = async () => {
  return new Promise(async (resolve, reject) => {
    
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
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
      await updateGenre(page);
      page.setDefaultNavigationTimeout(120000);
      await page.goto(`https://insider.in/all-events-in-kolkata`);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000); // Adjust the timeout value as needed
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
      await smoothScroll(page);

      const events = await getEvents(page);
      resolve(events);
      await browser.close();
    } catch (error) {
      console.log("errordatacrawl", error);
      

      reject(error);
      // throw error;
    }
  });
};

const getEvents = async (page) => {
  return new Promise(async (resolve, reject) => {
    try {
      const eventCardElements = await page.$$('[data-ref="event_card"]');
      const eventCardData = [];

      for (const eventCardElement of eventCardElements) {
        const imgTag = await eventCardElement.$("img");
        const aTag = await eventCardElement.$("a");
        const spanTag = await eventCardElement.$("span");

        if (imgTag && aTag) {
          const src = await imgTag.evaluate((img) => img.src);
          const href = await aTag.evaluate((a) => a.href);
          const genre = await spanTag.evaluate((span) => span.innerText);
          const ariaLabel = await eventCardElement.evaluate((card) =>
            card.getAttribute("aria-label")
          );

          eventCardData.push({
            src,
            href,
            genre,
            ariaLabel,
          });
        }
      }
      //  console.log("eventCardData.length", eventCardData.length);
      resolve(eventCardData);
    } catch (error) {
      //  console.log("error", error);
      reject(null);
    }
  });
};
async function smoothScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const distance = 500; // Distance to scroll in each step
      const delay = 1000; // Delay between each scroll step

      const scrollHeight = document.documentElement.scrollHeight; // Use document.documentElement.scrollHeight to get the total height of the document
      let currentPosition = 0;
      let cnt = 0;
      const scrollInterval = setInterval(() => {
        window.scrollBy(0, distance);
        currentPosition += distance;
        cnt++;
        if (cnt >= 60) {
          clearInterval(scrollInterval);
          resolve();
        }
      }, delay);
    });
  });
}
