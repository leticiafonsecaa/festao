// Upload e remoção de capas no Supabase Storage (bucket `covers`).
// Path: covers/{user_id}/{event_id}.jpg — o 1º segmento é o auth.uid() do
// dono, validado pelas policies da migration 20261012103000_storage.sql.
//
// ATENÇÃO: o bucket é público para leitura (a página pública do evento
// exibe a capa). Qualquer pessoa com a URL consegue acessar o arquivo.

import { supabase, isSupabaseConfigured } from '../supabase';

const BUCKET = 'covers';

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Sessão expirada. Entre novamente para enviar a capa.');
  }
  return data.user.id;
}

/** Envia a capa comprimida (data URL JPEG) e devolve a URL pública. */
export async function uploadCoverForEvent(eventId: string, dataUrl: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Armazenamento remoto não configurado.');
  }
  const userId = await requireUserId();
  const path = `${userId}/${eventId}.jpg`;
  const blob = dataUrlToBlob(dataUrl);

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true, // substituir capa do mesmo evento = mesmo path
    contentType: 'image/jpeg',
  });
  if (error) throw error;

  // cache-buster manual: o upsert mantém o mesmo path/URL; sem o sufixo ?v=,
  // o cache de CDN poderia continuar servindo a capa anterior após uma
  // substituição. (getPublicUrl desta versão do storage-js não expõe
  // options.cacheBust; o URL público não possui query prévia.)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/**
 * Remove o arquivo de capa do evento (melhor esforço). Se falhar, o campo
 * hero_image_url já foi limpo no banco — sobra apenas um arquivo órfão no
 * bucket, sem impacto na UI.
 */
export async function removeCoverForEvent(eventId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const userId = await requireUserId();
  const { error } = await supabase.storage.from(BUCKET).remove([`${userId}/${eventId}.jpg`]);
  if (error) throw error;
}
