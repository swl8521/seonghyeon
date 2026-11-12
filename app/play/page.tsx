import { redirect } from "next/navigation";

// v1의 3인 혼합 21장 라운드는 폐기되고, 전각별 수행(/z/[sage]/practice)으로
// 대체된다 (SPEC v4 §4.9). 전각 화면이 아직 없는 동안은 광장으로 돌려보낸다.
export default function PlayPage() {
  redirect("/");
}
