export interface CaptureFrameOptions {
  height?: number;
  mirror?: boolean;
  quality?: number;
  width?: number;
}

export function calculateCoverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const width = sourceHeight * targetRatio;
    return { sx: (sourceWidth - width) / 2, sy: 0, sw: width, sh: sourceHeight };
  }

  const height = sourceWidth / targetRatio;
  return { sx: 0, sy: (sourceHeight - height) / 2, sw: sourceWidth, sh: height };
}

export function captureFrame(
  video: HTMLVideoElement,
  options: CaptureFrameOptions = {},
): string {
  const { height = 540, mirror = true, quality = 0.82, width = 720 } = options;

  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
    throw new Error("The camera is not ready to capture a photo yet.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the photo canvas.");

  const crop = calculateCoverCrop(video.videoWidth, video.videoHeight, width, height);
  if (mirror) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

export function dataUrlToArrayBuffer(dataUrl: string) {
  const encoded = dataUrl.split(",")[1];
  if (!encoded) throw new Error("The captured photo data was invalid.");
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}
