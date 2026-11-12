import { redirect } from "next/navigation";

// v1의 "대표 유형" 결과 화면은 폐기되고, 전각별 수행 결과(/z/[sage]/result)로
// 대체된다 (SPEC v4 §4.9). 전각 화면이 아직 없는 동안은 광장으로 돌려보낸다.
export default function ResultPage() {
  redirect("/");
}
