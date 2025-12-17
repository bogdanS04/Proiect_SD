import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: { port: 5173, host: true }, // doar dacă vrei să rulezi dev local
    build: { outDir: 'dist' }
})
