import path from "path";
import { defineConfig } from "vite";

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "ReactorRxDOM",
      fileName: format => `index.${format}.js`,
      formats: ["es", "cjs"],
    },
  },
});
