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
      return { item: it };
    });
  } else {
    const fuse = new Fuse(envEvent.events, {
      keys: ["ariaLabel"],
      includeMatches: true,
    });
    const res = fuse.search(query);
    if (res.length === 0) return [];
    const clm = res[0].matches[0].indices[0];
    const didYmean = res[0].item.ariaLabel.substring(clm[0]);
    return [
      {
        item: {
          suggetion: true,
          value: didYmean,
          event: { event: res[0].item, query },
        },
      },
    ];
  }
};
