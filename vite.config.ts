import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ⬇️ MODIFICHE AGGIUNTE PER NGROK E ACCESSORI
  server: {
    // 1. Consente l'accesso dal tuo indirizzo IP locale e da ngrok
    host: true,
    port: 4173, 
    
    // 2. Configurazione HMR (Hot Module Replacement) per ngrok
    //    Questo risolve i problemi di aggiornamento in tempo reale
    hmr: {
      host: 'andy-nondecorative-rickey.ngrok-free.dev',
      protocol: 'wss', // ngrok usa https, quindi l'HMR deve usare wss (secure websocket)
    }
  },
  
  preview: {
    // 3. Aggiunge l'host ngrok alla lista degli host consentiti
    allowedHosts: ['andy-nondecorative-rickey.ngrok-free.dev'],
  }
  // ⬆️ FINE MODIFICHE
})
