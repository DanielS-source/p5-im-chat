import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { chatProxyPlugin } from './server/chatProxyPlugin';

export default defineConfig(({ mode }) => {
  // Empty prefix loads every .env var (not just VITE_-prefixed ones) into
  // process.env, so the dev-only proxy plugin can read ANTHROPIC_API_KEY
  // server-side without it ever reaching the client bundle.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [react(), chatProxyPlugin()],
  };
});
