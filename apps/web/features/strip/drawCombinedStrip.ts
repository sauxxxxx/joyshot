import { stripThemes, type StripThemeId } from "./stripThemes";

const WIDTH = 1200;
const PADDING = 54;
const GAP = 20;
const PHOTO_WIDTH = 536;
const PHOTO_HEIGHT = 402;
const HEADER = 160;
const FOOTER = 110;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A room photo could not be loaded."));
    image.src = source;
  });
}

export async function drawCombinedStrip(pairs: string[][], themeId: StripThemeId) {
  if (pairs.length !== 4 || pairs.some((pair) => pair.length !== 2)) {
    throw new Error("Four complete photo pairs are required.");
  }
  const theme = stripThemes[themeId];
  const height = HEADER + pairs.length * PHOTO_HEIGHT + (pairs.length - 1) * GAP + FOOTER;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the combined strip.");

  context.fillStyle = theme.background;
  context.fillRect(0, 0, WIDTH, height);
  context.fillStyle = theme.foreground;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 56px Fredoka, Trebuchet MS, sans-serif";
  context.fillText("Better together", WIDTH / 2, 62);
  context.font = "800 19px Nunito, Segoe UI, sans-serif";
  context.fillText("HOST", PADDING + PHOTO_WIDTH / 2, 119);
  context.fillText("GUEST", PADDING + PHOTO_WIDTH + GAP + PHOTO_WIDTH / 2, 119);

  const images = await Promise.all(pairs.flat().map(loadImage));
  images.forEach((image, index) => {
    const row = Math.floor(index / 2);
    const column = index % 2;
    const x = PADDING + column * (PHOTO_WIDTH + GAP);
    const y = HEADER + row * (PHOTO_HEIGHT + GAP);
    context.fillStyle = theme.panel;
    context.fillRect(x - 6, y - 6, PHOTO_WIDTH + 12, PHOTO_HEIGHT + 12);
    context.drawImage(image, x, y, PHOTO_WIDTH, PHOTO_HEIGHT);
  });

  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date());
  context.fillStyle = theme.foreground;
  context.font = "700 22px Nunito, Segoe UI, sans-serif";
  context.fillText(`JOYSHOT · ${date.toUpperCase()}`, WIDTH / 2, height - 51);
  return canvas.toDataURL("image/png");
}
