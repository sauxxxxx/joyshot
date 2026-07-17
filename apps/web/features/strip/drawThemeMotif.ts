import { stripThemes, type StripThemeId } from "./stripThemes";

type StripTheme = (typeof stripThemes)[StripThemeId];

export function drawThemeMotif(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: StripTheme,
) {
  context.save();
  context.fillStyle = theme.accent;
  context.strokeStyle = theme.accent;
  context.globalAlpha = 0.34;

  if (theme.motif === "confetti") drawConfetti(context, width, height);
  if (theme.motif === "stars") drawStars(context, width, height);
  if (theme.motif === "hearts") drawHearts(context, width, height);
  if (theme.motif === "film") drawSprockets(context, width, height);
  if (theme.motif === "dots") drawDots(context, width, height);
  if (theme.motif === "rays") drawRays(context, width);
  if (theme.motif === "frame") {
    context.lineWidth = 10;
    context.strokeRect(18, 18, width - 36, height - 36);
  }
  if (theme.motif === "clean") {
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(width * 0.34, 128);
    context.lineTo(width * 0.66, 128);
    context.stroke();
  }
  context.restore();
}

function drawConfetti(context: CanvasRenderingContext2D, width: number, height: number) {
  const points = [[0.08, 48], [0.17, 112], [0.82, 64], [0.91, 126], [0.1, height - 62], [0.88, height - 48]];
  for (const [x, y] of points) {
    context.save();
    context.translate(width * x, y);
    context.rotate(x * 5);
    context.fillRect(-8, -3, 16, 6);
    context.restore();
  }
}

function drawStars(context: CanvasRenderingContext2D, width: number, height: number) {
  for (const [x, y] of [[0.09, 54], [0.19, 118], [0.81, 46], [0.92, 112], [0.12, height - 50], [0.86, height - 56]]) {
    context.save();
    context.translate(width * x, y);
    context.rotate(Math.PI / 4);
    context.fillRect(-4, -15, 8, 30);
    context.fillRect(-15, -4, 30, 8);
    context.restore();
  }
}

function drawHearts(context: CanvasRenderingContext2D, width: number, height: number) {
  for (const [x, y] of [[0.1, 70], [0.88, 82], [0.13, height - 54], [0.84, height - 48]]) {
    context.save();
    context.translate(width * x, y);
    context.beginPath();
    context.moveTo(0, 14);
    context.bezierCurveTo(-5, 7, -16, 1, -16, -7);
    context.bezierCurveTo(-16, -15, -5, -18, 0, -9);
    context.bezierCurveTo(5, -18, 16, -15, 16, -7);
    context.bezierCurveTo(16, 1, 5, 7, 0, 14);
    context.fill();
    context.restore();
  }
}

function drawSprockets(context: CanvasRenderingContext2D, width: number, height: number) {
  for (let y = 36; y < height - 30; y += 52) {
    context.fillRect(12, y, 20, 30);
    context.fillRect(width - 32, y, 20, 30);
  }
}

function drawDots(context: CanvasRenderingContext2D, width: number, height: number) {
  for (const y of [45, 92, height - 82, height - 40]) {
    for (let x = 45; x < width; x += 54) {
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawRays(context: CanvasRenderingContext2D, width: number) {
  context.translate(width / 2, 78);
  for (let index = 0; index < 12; index += 1) {
    context.rotate(Math.PI / 6);
    context.fillRect(0, -3, width * 0.44, 6);
  }
}
