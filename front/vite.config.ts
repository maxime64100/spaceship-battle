import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
    plugins: [
        checker({
            typescript: true,
        }),
    ],
    server: {
        port: 5173,
        open: true,
        proxy: {
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
            },
        },
    },
});
