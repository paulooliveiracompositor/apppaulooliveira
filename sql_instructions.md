# Configuração do Storage no Supabase

Para permitir que o seu aplicativo faça uploads sem erros de bloqueio de segurança:

1. No menu esquerdo do Supabase, clique em **SQL Editor**
2. Crie uma **New Query** (Nova Consulta)
3. Cole todo o código abaixo:

```sql
-- Garante que o bucket msc_media existe (se criar manualmente, não problema rodar isso de novo)
insert into storage.buckets (id, name, public)
values ('msc_media', 'msc_media', true)
on conflict (id) do nothing;

-- 1. Permite Leitura Pública de qualquer arquivo (Tocar as músicas)
create policy "Media Pública"
  on storage.objects for select
  using ( bucket_id = 'msc_media' );

-- 2. Permite Upload (Inseção) anônimo para simplificar a versão inicial (Admin Dashboard)
create policy "Anon Uploads Mídia"
  on storage.objects for insert
  with check ( bucket_id = 'msc_media' );

-- 3. Permite Exclusão (Soft Delete) se precisar remover mp3s/capas pelo app
create policy "Anon Delete Mídia"
  on storage.objects for delete
  using ( bucket_id = 'msc_media' );

-- Se quiser garantir também atualizações no mesmo arquivo:
create policy "Anon Update Mídia"
  on storage.objects for update
  using ( bucket_id = 'msc_media' );
```

4. Clique no botão **`Run`** (Rodar) no canto inferior direito.
