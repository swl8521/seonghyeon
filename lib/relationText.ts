import type { Relation } from "./judge";

export function relationText(relation: Relation, sageName: string): string {
  switch (relation) {
    case "mutual":
      return `${sageName}와 서로 알아보았습니다`;
    case "unrequited":
      return `당신은 ${sageName}를 따랐지만, ${sageName}는 당신을 받아들이지 않았습니다`;
    case "unexpected":
      return `밀어냈지만, ${sageName}는 당신을 알아보았습니다`;
    case "none":
      return `${sageName}와는 인연이 닿지 않았습니다`;
  }
}
