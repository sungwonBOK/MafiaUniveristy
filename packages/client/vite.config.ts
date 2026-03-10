import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @mafia-university/shared 를 로컬 소스로 직접 참조
      '@mafia-university/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    // 개발 중 백엔드 API / Socket.IO 요청 프록시
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,        // WebSocket 프록시 활성화
        changeOrigin: true,
      },
    },
  },
});
