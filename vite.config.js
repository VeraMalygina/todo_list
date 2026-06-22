import { defineConfig } from "vite";
import symfonyPlugin from "vite-plugin-symfony";

/* if you're using React */
// import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        /* react(), // if you're using React */
        symfonyPlugin(),
    ],
    server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: true,

        hmr: {
            host: "192.168.1.98",
            port: 5173,
        },
        cors: {
            origin: [
                "http://localhost:8080",
                "http://127.0.0.1:8080",
                "http://192.168.1.98:8080",
            ],
        },
    },

    build: {
        rollupOptions: {
            input: {
                app: "./assets/app.js",
            },
        },
    },
});
