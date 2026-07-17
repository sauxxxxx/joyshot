import type { PhotoLayoutId } from "@photobooth/shared";
import { stripThemes, type StripThemeId } from "./stripThemes";
import { drawThemeMotif } from "./drawThemeMotif";
import { calculatePhotoLayout, drawImageCover } from "./photoLayouts";

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A captured photo could not be loaded."));
    image.src = source;
  });
}

function drawHeart(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.save();
  context.translate(x, y);
  context.scale(size / 32, size / 32);
  context.beginPath();
  context.moveTo(16, 28);
  context.bezierCurveTo(13, 23, 2, 17, 2, 9);
  context.bezierCurveTo(2, 1, 12, -2, 16, 5);
  context.bezierCurveTo(20, -2, 30, 1, 30, 9);
  context.bezierCurveTo(30, 17, 19, 23, 16, 28);
  context.fill();
  context.restore();
}

export async function drawSoloStrip(photos: string[], themeId: StripThemeId, layoutId: PhotoLayoutId = "strip") {
  if (photos.length !== 4) throw new Error("Four photos are required to build the strip.");

  const theme = stripThemes[themeId];
  const layout = calculatePhotoLayout(4, layoutId);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the photo strip.");

  context.fillStyle = theme.background;
  context.fillRect(0, 0, layout.width, layout.height);
  drawThemeMotif(context, layout.width, layout.height, theme);

  context.fillStyle = theme.foreground;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 50px Fredoka, Trebuchet MS, sans-serif";
  context.fillText("JoyShot", layout.width / 2, 66);
  context.font = "700 20px Nunito, Segoe UI, sans-serif";
  context.fillText("FOUR LITTLE MOMENTS, ONE KEEPSAKE", layout.width / 2, 111);

  const images = await Promise.all(photos.map(loadImage));
  images.forEach((image, index) => {
    const frame = layout.frames[index];
    context.fillStyle = theme.panel;
    context.fillRect(frame.x - 8, frame.y - 8, frame.width + 16, frame.height + 16);
    drawImageCover(context, image, frame);

    context.fillStyle = theme.accent;
    context.beginPath();
    context.arc(frame.x + frame.width - 28, frame.y + 30, 22, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = theme.badgeForeground;
    context.font = "800 20px Nunito, Segoe UI, sans-serif";
    context.fillText(String(index + 1), frame.x + frame.width - 28, frame.y + 31);
  });

  context.fillStyle = theme.foreground;
  context.font = "700 22px Nunito, Segoe UI, sans-serif";
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date());
  context.fillText(date.toUpperCase(), layout.width / 2, layout.height - 52);
  context.fillStyle = theme.accent;
  drawHeart(context, 66, layout.height - 72, 36);
  drawHeart(context, layout.width - 102, layout.height - 72, 36);

  return canvas.toDataURL("image/png");
}
