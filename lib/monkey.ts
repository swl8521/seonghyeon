import type { SageId, Verse } from "./types";

export const MONKEY_POSES = [
  "read", "think", "wave", "meditate", "rest", "point", "grow", "shrug",
  "hug", "explore", "stretch", "bow", "surprise", "listen", "cheer", "sleep",
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
};

// Each entry follows the corresponding verse number, so a quote keeps its pose
// across shuffled rounds and the saved matching cards.
const VERSE_POSES: Record<SageId, readonly MonkeyPose[]> = {
  confucius: ["read", "wave", "explore", "shrug", "listen", "hug", "listen", "stretch", "think", "grow", "surprise", "hug", "meditate", "think", "bow", "stretch", "explore", "bow", "point", "cheer"],
  laozi: ["meditate", "think", "rest", "stretch", "meditate", "rest", "shrug", "surprise", "listen", "meditate", "read", "rest", "grow", "listen", "meditate", "cheer", "bow", "grow", "sleep", "meditate"],
  sunzi: ["explore", "meditate", "point", "think", "stretch", "point", "explore", "shrug", "stretch", "explore", "think", "point", "think", "explore", "surprise", "bow", "rest", "stretch", "bow", "cheer"],
};

export function getVersePose(verse: Verse): MonkeyPose {
  const number = Number(verse.id.split("-").at(-1));
  return VERSE_POSES[verse.sage][number - 1] ?? "think";
}
