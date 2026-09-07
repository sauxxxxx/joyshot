import type { PhotoLayoutId } from "@photobooth/shared";
import { createPhotoEdit, type PhotoEdit, type StripTextOptions } from "../editor/photoEdits";
import { stripThemes, type StripThemeId } from "./stripThemes";
import { drawFrameBacking, drawFrameOverlay, drawThemeMotif } from "./drawThemeMotif";
import { calculatePhotoLayout, drawImageCover } from "./photoLayouts";

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A captured photo could not be loaded."));
    image.src = source;
  });
}

export async function drawSoloStrip(
  photos: string[] | PhotoEdit[],
  themeId: StripThemeId,
  layoutId: PhotoLayoutId = "strip",
  text: StripTextOptions = {},
) {
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
  context.font = "bold 50px Georgia, serif";
  context.fillText((text.title || "JoyShot").slice(0, 34), layout.width / 2, 66);
  context.font = "700 20px Helvetica Neue, Arial, sans-serif";
  context.fillText("FOUR LITTLE MOMENTS, ONE KEEPSAKE", layout.width / 2, 111);

  if (text.logoSource) {
    const logo = await loadImage(text.logoSource);
    const size = 76;
    context.drawImage(logo, layout.width - size - 42, 28, size, size);
  }

  const edits = photos.map((photo) => typeof photo === "string" ? createPhotoEdit(photo) : photo);
  const images = await Promise.all(edits.map((edit) => loadImage(edit.source)));
  images.forEach((image, index) => {
    const frame = layout.frames[index];
    drawFrameBacking(context, frame, theme, index);
    drawImageCover(context, image, frame, edits[index]);
    drawFrameOverlay(context, frame, theme, index);
  });

  context.fillStyle = theme.foreground;
  context.font = "700 22px Helvetica Neue, Arial, sans-serif";
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date());
  context.fillText((text.caption || date).slice(0, 64).toUpperCase(), layout.width / 2, layout.height - 52);
  context.fillStyle = text.brandColor || theme.accent;
  context.fillRect(48, layout.height - 55, 72, 4);
  context.fillRect(layout.width - 120, layout.height - 55, 72, 4);

  return canvas.toDataURL("image/png");
}
