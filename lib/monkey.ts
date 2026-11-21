import type { Verse } from "./types";

export const MONKEY_POSES = [
  "read", "think", "wave", "meditate", "rest", "point", "grow", "shrug",
  "hug", "explore", "stretch", "bow", "surprise", "listen", "cheer", "sleep",
  "bananaEat", "bananaBunch", "bananaPeel",
] as const;

export type MonkeyPose = (typeof MONKEY_POSES)[number];

/** New individually drawn stickers, mapped onto the existing semantic poses. */
export const MONKEY_IMAGE_BY_POSE: Record<MonkeyPose, string> = {
  read: "/characters/monkey-v2/monkey-01-reading.webp",
  think: "/characters/monkey-v2/monkey-02-thinking.webp",
  wave: "/characters/monkey-v2/monkey-03-cheering.webp",
  meditate: "/characters/monkey-v2/monkey-05-sleepy.webp",
  rest: "/characters/monkey-v2/monkey-05-sleepy.webp",
  point: "/characters/monkey-v2/monkey-07-pointing.webp",
  grow: "/characters/monkey-v2/monkey-08-celebrating.webp",
  shrug: "/characters/monkey-v2/monkey-06-surprised.webp",
  hug: "/characters/monkey-v2/monkey-04-heart.webp",
  explore: "/characters/monkey-v2/monkey-09-banana-holding.webp",
  stretch: "/characters/monkey-v2/monkey-03-cheering.webp",
  bow: "/characters/monkey-v2/monkey-01-reading.webp",
  surprise: "/characters/monkey-v2/monkey-06-surprised.webp",
  listen: "/characters/monkey-v2/monkey-02-thinking.webp",
  cheer: "/characters/monkey-v2/monkey-08-celebrating.webp",
  sleep: "/characters/monkey-v2/monkey-05-sleepy.webp",
  bananaEat: "/characters/monkey-v2/monkey-10-banana-eating.webp",
  bananaBunch: "/characters/monkey-v2/monkey-11-banana-bunch.webp",
  bananaPeel: "/characters/monkey-v2/monkey-12-banana-peel.webp",
};

// These twelve entries point to twelve distinct drawings. Hashing the complete
// id also supports split ids such as `confucius-12-21b` and `sunzi-11-j`.
const VERSE_POSES = [
  "read", "think", "wave", "hug", "rest", "surprise",
  "point", "cheer", "explore", "bananaEat", "bananaBunch", "bananaPeel",
] as const satisfies readonly MonkeyPose[];

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getVersePose(verse: Verse): MonkeyPose {
  return VERSE_POSES[stableHash(verse.id) % VERSE_POSES.length];
}
