import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'gsap-vendor': ['gsap'],
                    'matter-vendor': ['matter-js'],
                    'radix-vendor': [
                        '@radix-ui/react-accordion',
                        '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-hover-card',
                        '@radix-ui/react-label',
                        '@radix-ui/react-scroll-area',
                        '@radix-ui/react-slot',
                    ],
                },
            },
        },
    },
});
