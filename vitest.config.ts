import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./resources/js/test/setup.ts'],
        globals: true,
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            '@assets': resolve(__dirname, 'resources/assets'),
            '@': resolve(__dirname, 'resources/js'),
        },
    },
});
