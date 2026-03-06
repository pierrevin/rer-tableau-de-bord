import "dotenv/config";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getPublicUrl } from "@/lib/storage";

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
  "articles";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const QUALITY = 70; // 0–100 pour sharp

async function main() {
  if (!supabaseAdmin) {
    console.error(
      "Supabase admin non initialisé. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { contenu: { contains: "i.ibb.co" } },
        { lienPhoto: { contains: "i.ibb.co" } },
      ],
    },
  });

  console.log(`Articles contenant des images ibb : ${articles.length}`);

  const urlMap = new Map<string, string>();

  for (const article of articles) {
    const articleId = article.id;
    const rawHtml = article.contenu ?? "";
    const rawLienPhoto = article.lienPhoto ?? "";

    const urls = new Set<string>();
    extractIbbUrls(rawHtml).forEach((u) => urls.add(u));
    extractIbbUrls(rawLienPhoto).forEach((u) => urls.add(u));

    if (urls.size === 0) continue;

    console.log(`Article ${articleId}: ${urls.size} URL(s) ibb à traiter.`);

    const replacements: { from: string; to: string }[] = [];

    for (const url of urls) {
      try {
        const existing = urlMap.get(url);
        if (existing) {
          replacements.push({ from: url, to: existing });
          continue;
        }

        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Échec téléchargement ${url}: ${res.status}`);
          continue;
        }
        const arrayBuffer = await res.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        const image = sharp(inputBuffer);
        const metadata = await image.metadata();
        const width = metadata.width ?? MAX_WIDTH;
        const height = metadata.height ?? MAX_HEIGHT;

        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
        const targetWidth = Math.round(width * ratio);
        const targetHeight = Math.round(height * ratio);

        const outputBuffer = await image
          .resize(targetWidth, targetHeight, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: QUALITY })
          .toBuffer();

        const key = buildObjectKey(articleId, url);

        const uploadRes = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(key, outputBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadRes.error) {
          console.error(`Erreur upload Supabase pour ${url}:`, uploadRes.error);
          continue;
        }

        const publicUrl = getPublicUrl(key);
        if (!publicUrl) {
          console.error(`Impossible de récupérer l’URL publique pour la clé ${key}`);
          continue;
        }

        urlMap.set(url, publicUrl);
        replacements.push({ from: url, to: publicUrl });
      } catch (e) {
        console.error(`Erreur traitement image ${url}:`, e);
      }
    }

    if (replacements.length === 0) continue;

    let newContenu = rawHtml;
    let newLienPhoto = rawLienPhoto;

    for (const { from, to } of replacements) {
      newContenu = newContenu.split(from).join(to);
      if (newLienPhoto.includes(from)) {
        newLienPhoto = newLienPhoto.split(from).join(to);
      }
    }

    await prisma.article.update({
      where: { id: articleId },
      data: {
        contenu: newContenu,
        lienPhoto: newLienPhoto || null,
      },
    });

    console.log(`Article ${articleId} mis à jour.`);
  }

  console.log("Migration ibb terminée.");
}

function extractIbbUrls(input: string): string[] {
  const regex = /https?:\/\/i\.ibb\.co\/[^\s"'<>)+]+/g;
  const matches = input.match(regex);
  return matches ? Array.from(new Set(matches)) : [];
}

function buildObjectKey(articleId: string, url: string): string {
  const safeArticleId = articleId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "misc";
  const hashBase = Buffer.from(url).toString("base64url").slice(0, 16);
  return `articles/${safeArticleId}/${hashBase}.jpg`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

