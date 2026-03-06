import { ingestDebug } from "@/lib/ingest-debug";

type UploadArticleImageParams = {
  file: File;
  /**
   * Nom de fichier d’origine (facultatif, sinon on prend file.name).
   */
  filename?: string;
  /**
   * Identifiant d’article, pour ranger les fichiers par article côté storage.
   */
  articleId?: string | null;
};

export type UploadArticleImageResult = {
  publicUrl: string;
};

/**
 * Upload d’une image d’article :
 * - compression / resize côté client
 * - appel à /api/upload-url pour obtenir une URL signée Supabase
 * - upload du blob compressé via uploadToSignedUrl
 * - retour de l’URL publique utilisable dans le contenu ou comme image principale
 */
export async function uploadArticleImage(
  params: UploadArticleImageParams
): Promise<UploadArticleImageResult> {
  const { file, filename, articleId } = params;

  // Import dynamique pour éviter de charger inutilement ces modules.
  const [{ compressAndResizeImage }, { supabaseClient, SUPABASE_STORAGE_BUCKET }] =
    await Promise.all([
      import("./compressAndResizeImage"),
      import("./supabase-client"),
    ]);

  if (!supabaseClient) {
    throw new Error("Upload d’images non configuré (Supabase manquant).");
  }

  // #region agent log
  ingestDebug({
    sessionId: "a34272",
    runId: "pre-fix",
    hypothesisId: "H_IMG_UPLOAD_HELPER",
    location: "lib/uploadArticleImage.ts:uploadArticleImage:start",
    message: "uploadArticleImage called",
    data: {
      fileName: file.name,
      fileSize: file.size,
      articleId: articleId ?? null,
    },
  });
  // #endregion

  const compressed = (await compressAndResizeImage(file, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.7,
    mimeType: "image/jpeg",
  })) as Blob;

  const contentType = compressed.type || file.type || "image/jpeg";
  const safeFilename = filename || file.name || "image.jpg";

  const uploadUrlRes = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: safeFilename,
      contentType,
      articleId: articleId ?? null,
      size: compressed.size,
    }),
  });

  if (!uploadUrlRes.ok) {
    let errorMessage = "Erreur lors de la préparation de l’upload.";
    try {
      const err = await uploadUrlRes.json();
      if (err?.error && typeof err.error === "string") {
        errorMessage = err.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const data: {
    path: string;
    token: string;
    key: string;
    publicUrl: string | null;
  } = await uploadUrlRes.json();

  // #region agent log
  ingestDebug({
    sessionId: "a34272",
    runId: "pre-fix",
    hypothesisId: "H_IMG_UPLOAD_HELPER",
    location: "lib/uploadArticleImage.ts:uploadArticleImage:afterUploadUrl",
    message: "Received signed upload URL (helper)",
    data: {
      path: data.path,
      hasToken: !!data.token,
      contentType,
    },
  });
  // #endregion

  const uploadResult = await supabaseClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .uploadToSignedUrl(data.path, data.token, compressed, {
      contentType,
    });

  if (uploadResult.error) {
    // #region agent log
    ingestDebug({
      sessionId: "a34272",
      runId: "pre-fix",
      hypothesisId: "H_IMG_UPLOAD_HELPER",
      location: "lib/uploadArticleImage.ts:uploadArticleImage:uploadError",
      message: "Erreur lors de l’upload de l’image (helper).",
      data: {
        message: uploadResult.error.message,
        name: uploadResult.error.name,
      },
    });
    // #endregion
    throw new Error("Erreur lors de l’upload de l’image.");
  }

  const publicUrl =
    data.publicUrl ??
    supabaseClient.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(data.key)
      .data.publicUrl;

  if (!publicUrl) {
    throw new Error("Impossible de récupérer l’URL publique de l’image.");
  }

  // #region agent log
  ingestDebug({
    sessionId: "a34272",
    runId: "pre-fix",
    hypothesisId: "H_IMG_UPLOAD_HELPER",
    location: "lib/uploadArticleImage.ts:uploadArticleImage:success",
    message: "Image uploaded successfully via helper",
    data: {
      hasPublicUrl: !!publicUrl,
      publicUrlLength: publicUrl.length,
    },
  });
  // #endregion

  return { publicUrl };
}

