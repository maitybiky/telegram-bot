import Fuse from "fuse.js";
import { envEvent } from "./db.js";


export const checkEvent = (query) => {
  if (envEvent.events.length === 0) {
    return [];
  }
  
  let exactMatch = envEvent.events.filter((str) =>
    str.ariaLabel.toLowerCase().includes(query.toLowerCase())
  );
  if (exactMatch.length > 0) {
    return exactMatch.map((it) => {
      return { item: it,query };
    });
  } else {
    const fuse = new Fuse(envEvent.events, {
      keys: ["ariaLabel"],
      includeMatches: true,
      includeScore: true,
    });
    const res = fuse.search(query);
    if (res.length === 0) return [];
    const fuse2 = new Fuse(
      res[0].item.ariaLabel.split(" ").map((it) => ({ spl: it })),
      {
        keys: ["spl"],
        includeMatches: true,
      }
    );
    const res2 = fuse2.search(query);
    if (res2.length === 0) return [];
    const didYmean = res2[0].item.spl;
    //  console.log("didYmean", didYmean);
    return [
      {
        item: {
          suggetion: true,
          value: didYmean,
          event: { event: res[0].item, query },
        },
      },
    ]
  }
};
