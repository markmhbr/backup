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
            // Hanya pisahkan library murni non-React yang berukuran besar
            if (id.includes("node_modules/apexcharts")) {
              return "apexcharts";
            }
            if (id.includes("node_modules/leaflet")) {
              return "leaflet";
            }
            if (id.includes("node_modules/sweetalert2")) {
              return "sweetalert2";
            }
            if (id.includes("node_modules/swiper")) {
              return "swiper";
            }
            if (id.includes("node_modules/@fullcalendar") && !id.includes("@fullcalendar/react")) {
              return "fullcalendar";
            }
            
            // Biarkan React, React-DOM, dan wrapper React (react-apexcharts, react-leaflet, @fullcalendar/react)
            // tetap berada di satu chunk 'vendor' utama untuk menghindari masalah urutan inisialisasi di React 19.
            return "vendor";
          }
        },
      },
    },
  },
});
