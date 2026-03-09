import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export const LEGACY_LOGO_PUBLIC_PATH = "/uploads/Logo_rer_noir-hd.jpg";

const CUSTOM_LOGO_FILENAME = "admin-logo.png";
const CUSTOM_LOGO_PUBLIC_PATH = `/uploads/${CUSTOM_LOGO_FILENAME}`;
const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
const customLogoFilePath = path.join(uploadsDirectory, CUSTOM_LOGO_FILENAME);

export type SiteLogoPayload = {
  logoUrl: string;
  hasCustomLogo: boolean;
  updatedAt: number | null;
};

export async function getSiteLogoPayload(): Promise<SiteLogoPayload> {
  try {
    const metadata = await stat(customLogoFilePath);
    const updatedAt = metadata.mtimeMs;

    return {
      logoUrl: `${CUSTOM_LOGO_PUBLIC_PATH}?v=${updatedAt}`,
      hasCustomLogo: true,
      updatedAt,
    };
  } catch {
    return {
      logoUrl: LEGACY_LOGO_PUBLIC_PATH,
      hasCustomLogo: false,
      updatedAt: null,
    };
  }
}

export async function saveSiteLogo(input: Buffer): Promise<SiteLogoPayload> {
  await mkdir(uploadsDirectory, { recursive: true });

  const normalizedLogo = await sharp(input)
    .resize({
      width: 512,
      height: 512,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  await writeFile(customLogoFilePath, normalizedLogo);

  return getSiteLogoPayload();
}
