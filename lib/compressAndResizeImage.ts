"use client";

export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0–1
  mimeType?: string;
};

export async function compressAndResizeImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality = options.quality ?? 0.7;
  const mimeType = options.mimeType ?? "image/jpeg";

  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné n’est pas une image.");
  }

  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  const { width, height } = computeTargetSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxWidth,
    maxHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible d’initialiser le canvas pour la compression.");
  }

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, mimeType, quality);
  if (!blob) {
    throw new Error("Échec de la compression de l’image.");
  }

  return blob;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Lecture du fichier échouée."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Lecture du fichier échouée."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Chargement de l’image échoué."));
    img.src = src;
  });
}

function computeTargetSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  return { width, height };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

