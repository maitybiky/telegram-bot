import Fuse from "fuse.js";
import { envEvent } from "./db.js";

export const checkEvent = (query) => {
  const fuse = new Fuse(envEvent.events, { keys: ["ariaLabel"] });
  return fuse.search(query).slice(0,3);
};


