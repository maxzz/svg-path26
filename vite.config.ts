import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    base: "",
    build: {
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // It now splits node_modules into react, radix, state, svgo, ui, and a fallback vendor chunk.
                    if (!id.includes("node_modules")) return;
                    if (id.includes("react")) return "react";
                    if (id.includes("@radix-ui") || id.includes("radix-ui")) return "radix";
                    if (id.includes("jotai") || id.includes("valtio")) return "state";
                    if (id.includes("svgo")) return "svgo";
                    if (id.includes("lucide-react") || id.includes("motion") || id.includes("sonner") || id.includes("next-themes")) {
                        return "ui";
                    }
                    return "vendor";
                },
            },
        },
    },
    server: {
        port: 3000,
    },
    test: {
        globals: true,
        environment: "jsdom",
    },
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
