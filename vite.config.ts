import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', 'VITE_');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.VITE_MERCADOPAGO_PUBLIC_KEY': JSON.stringify(env.VITE_MERCADOPAGO_PUBLIC_KEY || 'APP_USR-NOT_CONFIGURED')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
