import type { PhotoLayoutId } from "@photobooth/shared";
import { stripThemes, type StripThemeId } from "./stripThemes";
import { drawThemeMotif } from "./drawThemeMotif";
import { calculatePhotoLayout, drawImageCover } from "./photoLayouts";

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A room photo could not be loaded."));
    image.src = source;
  });
}

export async function drawCombinedStrip(pairs: string[][], themeId: StripThemeId, layoutId: PhotoLayoutId = "strip") {
  if (pairs.length !== 4 || pairs.some((pair) => pair.length !== 2)) {
    throw new Error("Four complete photo pairs are required.");
  }
  const theme = stripThemes[themeId];
  const layout = calculatePhotoLayout(8, layoutId);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the combined strip.");

  context.fillStyle = theme.background;
  context.fillRect(0, 0, layout.width, layout.height);
  drawThemeMotif(context, layout.width, layout.height, theme);
  context.fillStyle = theme.foreground;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 56px Fredoka, Trebuchet MS, sans-serif";
  context.fillText("Better together", layout.width / 2, 62);
  context.font = "800 19px Nunito, Segoe UI, sans-serif";
  context.fillText("HOST + GUEST · FOUR SHARED MOMENTS", layout.width / 2, 119);

  const images = await Promise.all(pairs.flat().map(loadImage));
  images.forEach((image, index) => {
    const frame = layout.frames[index];
    context.fillStyle = theme.panel;
    context.fillRect(frame.x - 6, frame.y - 6, frame.width + 12, frame.height + 12);
    drawImageCover(context, image, frame);
  });

  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date());
  context.fillStyle = theme.foreground;
  context.font = "700 22px Nunito, Segoe UI, sans-serif";
  context.fillText(`JOYSHOT · ${date.toUpperCase()}`, layout.width / 2, layout.height - 51);
  return canvas.toDataURL("image/png");
}
