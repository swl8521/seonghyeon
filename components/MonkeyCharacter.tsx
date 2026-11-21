import Image from "next/image";
import { MONKEY_IMAGE_BY_POSE, type MonkeyPose } from "@/lib/monkey";

interface MonkeyCharacterProps {
  pose: MonkeyPose;
  size?: number;
  className?: string;
}

/** Decorative sticker image; every source asset has the same square canvas. */
export function MonkeyCharacter({ pose, size = 88, className = "" }: MonkeyCharacterProps) {
  return (
    <Image
      src={MONKEY_IMAGE_BY_POSE[pose]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`pointer-events-none inline-block shrink-0 select-none object-contain ${className}`}
    />
  );
}
