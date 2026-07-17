import type { PhotoLayoutId } from "@photobooth/shared";

export interface PhotoFrame { x: number; y: number; width: number; height: number; }
export interface PhotoLayout { width: number; height: number; header: number; footer: number; frames: PhotoFrame[]; }

export function calculatePhotoLayout(count: 4 | 8, layout: PhotoLayoutId): PhotoLayout {
  const width = count === 4 ? 900 : 1200;
  const header = 150;
  const footer = 110;
  const padding = 54;
  const gap = 20;
  const contentWidth = width - padding * 2;

  if (layout === "postcard") {
    const heroHeight = count === 4 ? 520 : 480;
    const smallColumns = count === 4 ? 3 : 4;
    const smallWidth = (contentWidth - gap * (smallColumns - 1)) / smallColumns;
    const smallHeight = smallWidth * .75;
    const smallRows = Math.ceil((count - 1) / smallColumns);
    const frames: PhotoFrame[] = [{ x: padding, y: header, width: contentWidth, height: heroHeight }];
    for (let index = 1; index < count; index += 1) {
      const slot = index - 1;
      frames.push({ x: padding + (slot % smallColumns) * (smallWidth + gap), y: header + heroHeight + gap + Math.floor(slot / smallColumns) * (smallHeight + gap), width: smallWidth, height: smallHeight });
    }
    return { width, header, footer, frames, height: header + heroHeight + gap + smallRows * smallHeight + Math.max(0, smallRows - 1) * gap + footer };
  }

  const columns = layout === "strip" ? (count === 4 ? 1 : 2) : layout === "film" ? 4 : (count === 4 ? 2 : 4);
  const photoWidth = (contentWidth - gap * (columns - 1)) / columns;
  const photoHeight = layout === "film" ? photoWidth * .68 : photoWidth * .75;
  const rows = Math.ceil(count / columns);
  const frames = Array.from({ length: count }, (_, index) => ({
    x: padding + (index % columns) * (photoWidth + gap),
    y: header + Math.floor(index / columns) * (photoHeight + gap),
    width: photoWidth,
    height: photoHeight,
  }));
  return { width, header, footer, frames, height: header + rows * photoHeight + Math.max(0, rows - 1) * gap + footer };
}

export function drawImageCover(context: CanvasRenderingContext2D, image: HTMLImageElement, frame: PhotoFrame) {
  const sourceRatio = image.width / image.height;
  const targetRatio = frame.width / frame.height;
  let sx = 0; let sy = 0; let sw = image.width; let sh = image.height;
  if (sourceRatio > targetRatio) { sw = image.height * targetRatio; sx = (image.width - sw) / 2; }
  else { sh = image.width / targetRatio; sy = (image.height - sh) / 2; }
  context.drawImage(image, sx, sy, sw, sh, frame.x, frame.y, frame.width, frame.height);
}
