import type { PhotoLayoutId } from "@photobooth/shared";
import { createPhotoEdit, type PhotoEdit, type StripTextOptions } from "../editor/photoEdits";
import { stripThemes, type StripThemeId } from "./stripThemes";
import { drawFrameBacking, drawFrameOverlay, drawThemeMotif } from "./drawThemeMotif";
import { calculatePhotoLayout, drawImageCover } from "./photoLayouts";

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A room photo could not be loaded."));
    image.src = source;
  });
}

export async function drawCombinedStrip(
  pairs: Array<Array<string | PhotoEdit>>,
  themeId: StripThemeId,
  layoutId: PhotoLayoutId = "strip",
  text: StripTextOptions = {},
) {
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
  context.fillText((text.title || "Better together").slice(0, 34), layout.width / 2, 62);
  context.font = "800 19px Nunito, Segoe UI, sans-serif";
  context.fillText("HOST + GUEST · FOUR SHARED MOMENTS", layout.width / 2, 119);
  if (text.logoSource) {
    const logo = await loadImage(text.logoSource);
    context.drawImage(logo, layout.width - 112, 24, 76, 76);
  }

  const edits = pairs.flat().map((photo) => typeof photo === "string" ? createPhotoEdit(photo) : photo);
  const images = await Promise.all(edits.map((edit) => loadImage(edit.source)));
  images.forEach((image, index) => {
    const frame = layout.frames[index];
    drawFrameBacking(context, frame, theme, index);
    drawImageCover(context, image, frame, edits[index]);
    drawFrameOverlay(context, frame, theme, index);
  });

  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date());
  context.fillStyle = theme.foreground;
  context.font = "700 22px Nunito, Segoe UI, sans-serif";
  context.fillText((text.caption || `JOYSHOT · ${date.toUpperCase()}`).slice(0, 64), layout.width / 2, layout.height - 51);
  return canvas.toDataURL("image/png");
}
