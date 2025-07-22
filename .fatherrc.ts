import { defineConfig } from "father";
import { resolve } from "path";

export default defineConfig({
  cjs: {},
  prebundle: {
    deps: {},
  },
  alias: {
    "@/src": resolve("src"),
  },
});
