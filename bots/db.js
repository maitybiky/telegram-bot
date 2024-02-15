import redis from "redis";
import fs from "fs";
const redisConfig = {
  // host: '172.19.0.2',
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password:process.env.REDIS_PASS
};
 console.log("redisConfig with pass", redisConfig);
class UserChoices {
  constructor() {
    this.initialize();
  }
  async initialize() {
    try {
      //  console.log("creating db");

      this.db = redis.createClient(redisConfig);
      await this.db.connect();
      this.db.on("error", (err) => console.log("db Client Error", err));
    } catch (error) {
       console.error("Error initializing UserChoices:", error);
    }
  }
  adDnd(chatId, choice) {
    this.db
      .set(`dnd:${chatId}:${choice}`, "1", { EX: 7 * 24 * 60 * 60 })
      .catch((err) => {
        // Handling errors
         console.error("Error occurred:", err);
      });
  }
  hasDnd(chatId, choice) {
    return new Promise((resolve, reject) => {
      //  console.log(`dnd:${chatId}:${choice}`, `dnd:${chatId}:${choice}`)
      this.db
        .exists(`dnd:${chatId}:${choice}`)
        .then((data) => {
          resolve(data);
        })
        .catch(() => {
           console.log("has err", err);

          reject();
        });
    });
  }
  remDnd(chatId, choice) {
    this.db
      .del(`dnd:${chatId}:${choice}`)

      .catch((err) => {
         console.log("del err", err);
      });
  }
  addGenre(userId, choice) {
    //  console.log("choise", choice);
    this.db.sAdd(`db:${userId}`, choice).catch((err) => {
      // Handling errors
      //  console.error("Error occurred:", err);
    });
  }
  removeGenre(userId, choiceToRemove) {
    this.db.sRem(`db:${userId}`, choiceToRemove).then(()=>{

    })
    this.remDnd(userId,choiceToRemove);
  }

  getUserGenre(userId) {
    return new Promise((resolve, reject) => {
      this.db.sMembers(`db:${userId}`).then((choices) => {
        resolve(choices || []);
      });
    });
  }
  getAll(en = false) {
    return new Promise((resolve, reject) => {
      //  console.log("getall");
      this.db
        .KEYS("db*")
        .then((keys) => {
          let obj = {};
          const promises = keys.map((key) => {
            return this.db.sMembers(key).then((members) => {
              obj[key] = members;
            });
          });

          Promise.all(promises)
            .then(() => {
              if (en) resolve(obj);
              else resolve(Object.entries(obj));
            })
            .catch((err) => {
              //  console.error("Error:", err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

class Event {
  constructor() {
    this.events = [];
  }
  refreashEvent(data) {
    this.events = data;
  }
}
class pingFag {
  constructor() {
    // this.pingClient = null;
    this.init();
  }
  async init() {
    try {
      this.pingClient = redis.createClient(redisConfig);
      await this.pingClient.connect();
      this.pingClient.on("error", (err) =>
        console.log("ping flag Client Error", err)
      );
    } catch (error) {
      console.log('ping flag error',error)
    }
 
  }
  set(key, value) {
    return new Promise((resolve, reject) => {
      this.pingClient
        .set(`${key}`, value ? 1 : 0,{ EX: 90 })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          //  console.log("set err", err);
          reject();
        });
    });
  }
  has(key) {
    return new Promise((resolve, reject) => {
      this.pingClient
        .exists(`${key}`)
        .then((data) => {
          resolve(data);
        })
        .catch(() => {
          //  console.log("has err", err);

          reject();
        });
    });
  }
  get(key) {
    return new Promise((resolve, reject) => {
      this.pingClient
        .get(`${key}`)
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          //  console.log("get err", err);
          reject();
        });
    });
  }
  del(key) {
    return new Promise((resolve, reject) => {
      this.pingClient
        .del(`${key}`)

        .catch((err) => {});
    });
  }
}
export const addAnalytics = (obj) => {

  const filePath = "./analytics.json";
  fs.readFile(filePath, "utf-8", (err, res) => {
    if (err) {
      console.log("error", err);
      return;
    }
    
    let prevData = JSON.parse(res);
    prevData.push(obj);
    const updatedJson = JSON.stringify(prevData, null, 2);

    fs.writeFile(filePath, updatedJson, (err) => {
      if (err) {
        console.log("err", err);
      }
      return
    });
  });
};

export const pingResFlag = new pingFag();
export const didYmeanFlag = new Map();
export const envEvent = new Event();
export const User = new UserChoices();
