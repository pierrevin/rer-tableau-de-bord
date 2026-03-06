import { supabaseAdmin } from "./supabase-server";

type GetUploadUrlParams = {
  key: string;
  contentType: string;
  maxSizeBytes?: number;
};

export type UploadUrlResult = {
  path: string;
  token: string;
  key: string;
  publicUrl: string | null;
};

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "articles";

export function getPublicUrl(key: string): string | null {
  if (!supabaseAdmin) return null;
  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(key);
  return data?.publicUrl ?? null;
}

export async function getUploadUrl({
  key,
  contentType,
  maxSizeBytes,
}: GetUploadUrlParams): Promise<UploadUrlResult> {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase admin client non initialisé. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!/^image\//.test(contentType)) {
    throw new Error("Seuls les fichiers image sont autorisés.");
  }

  if (maxSizeBytes != null && maxSizeBytes <= 0) {
    throw new Error("Taille maximale invalide.");
  }

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(key, { upsert: true });

  if (error || !data) {
    throw new Error(error?.message || "Impossible de créer l’URL signée d’upload.");
  }

  const publicUrl = getPublicUrl(key);

  return {
    path: data.path,
    token: data.token,
    key,
    publicUrl,
  };
}

