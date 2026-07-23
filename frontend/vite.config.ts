import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "#": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ["lucide-react", "react-razorpay", "@clerk/react", "framer-motion", "@monaco-editor/react", "recharts", "three"],
  },
});
