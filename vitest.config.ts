import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // server/는 별도로 구현·테스트된 실시간 서버라 건드리지 않는다 (SPEC v4 §0).
    exclude: ["**/node_modules/**", "server/**"],
  },
});
