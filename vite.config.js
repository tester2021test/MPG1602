import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/MPG1602/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'HomeLedger — Interior & Majuri',
        short_name: 'HomeLedger',
        description: 'Interior Work, Appliances & Carpenter Majuri Khata',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/MPG1602/',
        scope: '/MPG1602/',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
