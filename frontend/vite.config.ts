import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [reactRouter()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
});