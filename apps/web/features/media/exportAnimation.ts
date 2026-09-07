import { drawImageCover } from "@/features/strip/photoLayouts";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { type PhotoEdit } from "@/features/editor/photoEdits";

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A photo could not be prepared for animation."));
    image.src = source;
  });
}

async function drawFrame(context: CanvasRenderingContext2D, edit: PhotoEdit, width: number, height: number) {
  const image = await loadImage(edit.source);
  drawImageCover(context, image, { x: 0, y: 0, width, height }, edit);
}

export async function createGif(edits: PhotoEdit[]) {
  const width = 480; const height = 360;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("GIF export is not supported by this browser.");
  const encoder = GIFEncoder();
  for (const edit of edits) {
    await drawFrame(context, edit, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const palette = quantize(pixels, 256);
    encoder.writeFrame(applyPalette(pixels, palette), width, height, { palette, delay: 850, repeat: 0 });
  }
  encoder.finish();
  const bytes = encoder.bytes();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: "image/gif" });
}

export async function createWebm(edits: PhotoEdit[]) {
  if (typeof MediaRecorder === "undefined") throw new Error("Video export is not supported by this browser.");
  const width = 640; const height = 480;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Video export is unavailable.");
  const stream = canvas.captureStream(12);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = ({ data }) => { if (data.size) chunks.push(data); };
  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });
  recorder.start();
  for (const edit of [...edits, ...edits]) {
    await drawFrame(context, edit, width, height);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
  }
  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  return stopped;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}
