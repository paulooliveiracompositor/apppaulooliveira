# Vibe Music Player PWA

> **Atenção Administrador Principal:** Veja o passo-a-passo ilustrado com senhas do painel em **[MANUAL DO PAULO](./MANUAL_DO_PAULO.md)**.

## Project Goal
Um aplicativo mobile-first PWA criado para Paulo Oliveira divulgar, apresentar e arquivar virtualmente suas obras musicais autorais de forma bonita e imersiva. O app possibilita audição via player global integrado, acompanhamento da letra com interface glassmorphism premium (estilo Vibe/Spotify/Apple Music), geração de QR Code de canções ou do app inteiro para difusão social e downloads focados. Há também formulário de Contato Direto via WhatsApp. 

## Tech Stack
* **Framework:** React 18 + Vite
* **Styling & UI:** TailwindCSS v4, Framer Motion (Transições e Efeitos), Lucide React (Ícones)
* **PWA:** vite-plugin-pwa (Instalação via navegador Safari/Chrome, Service Workers, Offline Assets)
* **Database & Storage:** Supabase (Autenticação omitida do usuário no front, PostgreSQL global para lista de canções e Buckets "msc_media" para armazenamento dos audios/capas).

## Setup/Run Instructions
1. Baixe as dependências do projeto contidas no `package.json`:
   ```bash
   npm install
   ```
2. Adicione ou verifique um arquivo na raiz do projeto chamado `.env.local` informando seu projeto Supabase (Variáveis de Ambiente):
   ```
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_KEY=sua_anon_key_aqui
   ```
3. Inicialize o servidor local no navegador:
   ```bash
   npm run dev
   ```

## Variável SQL Especial de Configuração
Dentro do banco de dados, rode o seguinte SQL para permitir tráfego anônimo (pela interface `/admin`) diretamente aos audios no storage do Bucket "msc_media":
```sql
insert into storage.buckets (id, name, public) values ('msc_media', 'msc_media', true) on conflict (id) do nothing;
create policy "Media Pública" on storage.objects for select using ( bucket_id = 'msc_media' );
create policy "Anon Uploads Mídia" on storage.objects for insert with check ( bucket_id = 'msc_media' );
create policy "Anon Delete" on storage.objects for delete using ( bucket_id = 'msc_media' );
```

## Deployment URL
> Planejado para implantação. Pode ser efetuado na Vercel (com `vercel` ou via Github) ou Netlify / Nekoweb (após `npm run build` mandando a pasta `/dist`).
> Sugestão: Hospedar em Vercel com: `npm i -g vercel && vercel`

## Changelog
* **v1.0.0 (Fev 2026):**
  * Inicialização Vite React + TailwindCSS v4.
  * Criação da interface Mobile First Glassmorphism (Premium Aesthetic) com Bottom Navbar.
  * Criação do Global PlayerContext para controle permanente de áudio.
  * Migração do mock array para Client Real Time Database usando Supabase.
  * Implantação do formulário nativo do painel Admin no endpoint `(URL)/admin` com upload de .MP3 e arquivos de capa PNG/JPG enviando dados direto para a Nuvem da Supabase usando supabase-js.
