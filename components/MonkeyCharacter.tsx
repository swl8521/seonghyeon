import { MONKEY_POSES, type MonkeyPose } from "@/lib/monkey";

interface MonkeyCharacterProps {
  pose: MonkeyPose;
  size?: number;
  className?: string;
}

/** Decorative atlas sprite; transparent padding keeps every pose in its cell. */
export function MonkeyCharacter({ pose, size = 88, className = "" }: MonkeyCharacterProps) {
  const index = MONKEY_POSES.indexOf(pose);

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/characters/monkey-poses-v1.png')",
        backgroundSize: "400% 400%",
        backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100 / 3}%`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
