import redis from "redis";

class UserChoices {
  constructor() {
    this.initialize();
  }
  async initialize() {
    try {
      this.db = redis.createClient();
      await this.db.connect();
      this.db.on("error", (err) => console.log("db Client Error", err));
    } catch (error) {
      console.error("Error initializing UserChoices:", error);
    }
  }
  addGenre(userId, choice) {
    console.log("choise", choice);
    this.db
      .sAdd(`db:${userId}`, choice)
      .then(() => {
        this.getAll()
          .then((data) => console.log("data", data))
          .catch((errr) => console.log("errr", errr));
      })
      .catch((err) => {
        // Handling errors
        console.error("Error occurred:", err);
      });
  }
  removeGenre(userId, choiceToRemove) {
    this.db.sRem(`db:${userId}`, choiceToRemove);
  }

  getUserGenre(userId) {
    return new Promise((resolve, reject) => {
      this.db.sMembers(`db:${userId}`, (err, choices) => {
        if (err) {
          reject(err);
        } else {
          resolve(choices || []);
        }
      });
    });
  }
  getAll(en=false) {
    return new Promise((resolve, reject) => {
      console.log("getall");
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
              if(en)
              resolve(obj);

              else
              resolve(Object.entries(obj));
            })
            .catch((err) => {
              console.error("Error:", err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
};
class Event {
  constructor() {
    this.events = [];
  }
  refreashEvent(data) {
    this.events = data;
  }
};
class pingFag {
  constructor() {
    // this.pingClient = null;
    this.init();
  }
  async init() {
    this.pingClient = redis.createClient();
    await this.pingClient.connect();
    this.pingClient.on("error", (err) =>
      console.log("ping flag Client Error", err)
    );
  }
  set(key, value) {
    return new Promise((resolve, reject) => {
      this.pingClient
        .set(`${key}`, value ? 1 : 0)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          console.log("set err", err);
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
          console.log("has err", err);

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
          console.log("get err", err);
          reject();
        });
    });
  }
  del(key) {
    return new Promise((resolve, reject) => {
      this.pingClient
        .del(`${key}`)
        .then((data) => {
          resolve(data);
        })
        .catch(() => {
          console.log("del err", err);

          reject();
        });
    });
  }
};
export const pingResFlag = new pingFag();
export const didYmeanFlag = new Map();
export const envEvent = new Event();
export const User = new UserChoices();
