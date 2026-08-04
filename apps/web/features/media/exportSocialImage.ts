function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The social image could not be prepared."));
    image.src = source;
  });
}

export type SocialPreset = "square" | "story";

export async function createSocialImage(strip: string, preset: SocialPreset) {
  const dimensions = preset === "story" ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 };
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width; canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Social export is unavailable.");
  const gradient = context.createLinearGradient(0, 0, dimensions.width, dimensions.height);
  gradient.addColorStop(0, "#fff1da"); gradient.addColorStop(.55, "#fff8f1"); gradient.addColorStop(1, "#eee8ff");
  context.fillStyle = gradient; context.fillRect(0, 0, dimensions.width, dimensions.height);
  const image = await loadImage(strip); const padding = preset === "story" ? 150 : 95;
  const scale = Math.min((dimensions.width - padding * 2) / image.width, (dimensions.height - padding * 2) / image.height);
  const width = image.width * scale; const height = image.height * scale;
  context.shadowColor = "rgba(24, 32, 51, .24)"; context.shadowBlur = 45; context.shadowOffsetY = 22;
  context.drawImage(image, (dimensions.width - width) / 2, (dimensions.height - height) / 2, width, height);
  return canvas.toDataURL("image/png");
}
