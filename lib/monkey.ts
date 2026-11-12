import type { SageId, Verse } from "./types";

export const MONKEY_POSES = [
  "read", "think", "wave", "meditate", "rest", "point", "grow", "shrug",
  "hug", "explore", "stretch", "bow", "surprise", "listen", "cheer", "sleep",
] as const;

export type MonkeyPose = (typeof MONKEY_POSES)[number];

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
