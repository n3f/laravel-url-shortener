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
            'ziggy-js': resolve(import.meta.dirname, 'vendor/tightenco/ziggy'),
            '@assets': resolve(import.meta.dirname, 'resources/assets'),
            '@': resolve(import.meta.dirname, 'resources/js'),
        },
    },
});
