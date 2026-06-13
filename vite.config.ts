import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@fullcalendar")) {
              return "fullcalendar";
            }
            if (id.includes("leaflet") || id.includes("react-leaflet")) {
              return "leaflet";
            }
            if (id.includes("apexcharts") || id.includes("react-apexcharts")) {
              return "charts";
            }
            if (id.includes("swiper")) {
              return "swiper";
            }
            if (id.includes("sweetalert2")) {
              return "sweetalert2";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
