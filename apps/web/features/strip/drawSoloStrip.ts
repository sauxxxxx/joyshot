import { stripThemes, type StripThemeId } from "./stripThemes";
import { drawThemeMotif } from "./drawThemeMotif";

const WIDTH = 900;
const SIDE_PADDING = 56;
const TOP_HEIGHT = 150;
const PHOTO_WIDTH = WIDTH - SIDE_PADDING * 2;
const PHOTO_HEIGHT = 591;
const PHOTO_GAP = 24;
const FOOTER_HEIGHT = 118;

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

export async function drawSoloStrip(photos: string[], themeId: StripThemeId) {
  if (photos.length !== 4) throw new Error("Four photos are required to build the strip.");

  const theme = stripThemes[themeId];
  const height = TOP_HEIGHT + PHOTO_HEIGHT * photos.length + PHOTO_GAP * 3 + FOOTER_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the photo strip.");

  context.fillStyle = theme.background;
  context.fillRect(0, 0, WIDTH, height);
  drawThemeMotif(context, WIDTH, height, theme);

  context.fillStyle = theme.foreground;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 50px Fredoka, Trebuchet MS, sans-serif";
  context.fillText("JoyShot", WIDTH / 2, 66);
  context.font = "700 20px Nunito, Segoe UI, sans-serif";
  context.fillText("FOUR LITTLE MOMENTS, ONE KEEPSAKE", WIDTH / 2, 111);

  const images = await Promise.all(photos.map(loadImage));
  images.forEach((image, index) => {
    const y = TOP_HEIGHT + index * (PHOTO_HEIGHT + PHOTO_GAP);
    context.fillStyle = theme.panel;
    context.fillRect(SIDE_PADDING - 8, y - 8, PHOTO_WIDTH + 16, PHOTO_HEIGHT + 16);
    context.drawImage(image, SIDE_PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);

    context.fillStyle = theme.accent;
    context.beginPath();
    context.arc(WIDTH - SIDE_PADDING - 28, y + 30, 22, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = theme.badgeForeground;
    context.font = "800 20px Nunito, Segoe UI, sans-serif";
    context.fillText(String(index + 1), WIDTH - SIDE_PADDING - 28, y + 31);
  });

  context.fillStyle = theme.foreground;
  context.font = "700 22px Nunito, Segoe UI, sans-serif";
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date());
  context.fillText(date.toUpperCase(), WIDTH / 2, height - 56);
  context.fillStyle = theme.accent;
  drawHeart(context, SIDE_PADDING + 12, height - 76, 36);
  drawHeart(context, WIDTH - SIDE_PADDING - 48, height - 76, 36);

  return canvas.toDataURL("image/png");
}
