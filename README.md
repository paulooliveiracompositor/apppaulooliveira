# Vibe Music Player PWA
.

## Project Goal
Um aplicativo mobile-first PWA criado para Paulo Oliveira divulgar, apresentar e arquivar virtualmente suas obras musicais autorais de forma bonita e imersiva. O app possibilita audição via player global integrado, acompanhamento da letra com interface glassmorphism premium (estilo Vibe/Spotify/Apple Music), geração de QR Code de canções ou do app inteiro para difusão social e downloads focados. Há também formulário de Contato Direto via WhatsApp. 

## Tech Stack
* **Framework:** React 18 + Vite
* **Styling & UI:** TailwindCSS v4, Framer Motion (Transições e Efeitos), Lucide React (Ícones)
* **PWA:** vite-plugin-pwa (Instalação via navegador Safari/Chrome, Service Workers, Offline Assets)
* **Database & Storage:** Supabase (Autenticação omitida do usuário no front, PostgreSQL global para lista de canções e Buckets "msc_media" para armazenamento dos audios/capas).

