import type { PhotoFrame } from "./photoLayouts";
import type { StripTheme } from "./stripThemes";

export function drawThemeMotif(context: CanvasRenderingContext2D, width: number, height: number, theme: StripTheme) {
  context.save();
  context.strokeStyle = theme.accent;
  context.fillStyle = theme.accent;
  context.globalAlpha = .28;
  if (theme.motif === "proof") drawCropMarks(context, width, height);
  if (theme.motif === "gingham") drawGingham(context, width, height);
  if (theme.motif === "negative") drawSprockets(context, width, height);
  if (theme.motif === "taped") drawDiagonalBand(context, width, 35, 72);
  if (theme.motif === "scrapbook") drawDoodles(context, width, height);
  if (theme.motif === "receipt") drawReceiptRules(context, width, height);
  if (theme.motif === "editorial") drawEditorialBlocks(context, width, height);
  if (theme.motif === "postcard") drawPostcardMark(context, width);
  if (theme.motif === "notebook") drawGraphPaper(context, width, height);
  if (theme.motif === "zine") drawHalftone(context, width, height);
  context.restore();
}

export function drawFrameBacking(context: CanvasRenderingContext2D, frame: PhotoFrame, theme: StripTheme, index: number) {
  const pad = theme.motif === "negative" ? 10 : theme.motif === "scrapbook" ? 9 : 8;
  context.save();
  context.shadowColor = "rgba(32, 25, 22, .18)";
  context.shadowBlur = theme.motif === "receipt" ? 0 : 14;
  context.shadowOffsetY = theme.motif === "editorial" ? 10 : 6;
  context.fillStyle = theme.motif === "editorial" && index % 2 ? theme.accent : theme.panel;
  context.fillRect(frame.x - pad, frame.y - pad, frame.width + pad * 2, frame.height + pad * 2);
  context.restore();
  if (theme.motif === "zine") {
    context.save();
    context.strokeStyle = theme.foreground;
    context.globalAlpha = .7;
    context.lineWidth = index % 2 ? 10 : 5;
    context.strokeRect(frame.x - pad, frame.y - pad, frame.width + pad * 2, frame.height + pad * 2);
    context.restore();
  }
}

export function drawFrameOverlay(context: CanvasRenderingContext2D, frame: PhotoFrame, theme: StripTheme, index: number) {
  context.save();
  context.strokeStyle = theme.accent;
  context.fillStyle = theme.accent;
  context.lineWidth = 4;
  if (theme.motif === "proof") drawFrameCorners(context, frame);
  if (theme.motif === "gingham") drawInkNote(context, frame, index);
  if (theme.motif === "negative") drawFrameSprockets(context, frame);
  if (theme.motif === "taped") drawTape(context, frame, index);
  if (theme.motif === "scrapbook") drawPaperCorners(context, frame, index);
  if (theme.motif === "receipt") {
    context.setLineDash([12, 9]);
    context.strokeRect(frame.x - 7, frame.y - 7, frame.width + 14, frame.height + 14);
  }
  if (theme.motif === "editorial") {
    context.globalAlpha = .82;
    context.fillRect(frame.x + (index % 2 ? -14 : frame.width - 8), frame.y + 16, 22, frame.height - 32);
  }
  if (theme.motif === "postcard") drawPhotoCorners(context, frame);
  if (theme.motif === "notebook") drawNotebookNumber(context, frame, index);
  if (theme.motif === "zine") drawRoughUnderline(context, frame, index);
  context.restore();
}

function drawCropMarks(context: CanvasRenderingContext2D, width: number, height: number) {
  context.lineWidth = 3;
  for (const [x, y, sx, sy] of [[34, 34, 1, 1], [width - 34, 34, -1, 1], [34, height - 34, 1, -1], [width - 34, height - 34, -1, -1]]) {
    context.beginPath(); context.moveTo(x, y + sy * 28); context.lineTo(x, y); context.lineTo(x + sx * 28, y); context.stroke();
  }
}

function drawGingham(context: CanvasRenderingContext2D, width: number, height: number) {
  for (let x = 0; x < width; x += 42) context.fillRect(x, 0, 17, height);
  for (let y = 0; y < height; y += 42) context.fillRect(0, y, width, 17);
}

function drawSprockets(context: CanvasRenderingContext2D, width: number, height: number) {
  context.globalAlpha = .55;
  for (let y = 28; y < height - 24; y += 48) {
    context.fillRect(13, y, 24, 28);
    context.fillRect(width - 37, y, 24, 28);
  }
}

function drawDiagonalBand(context: CanvasRenderingContext2D, width: number, y: number, bandHeight: number) {
  context.save(); context.beginPath(); context.rect(0, y, width, bandHeight); context.clip();
  for (let x = -bandHeight; x < width + bandHeight; x += 38) {
    context.save(); context.translate(x, y); context.rotate(-.55); context.fillRect(0, 0, 14, bandHeight * 1.8); context.restore();
  }
  context.restore();
}

function drawDoodles(context: CanvasRenderingContext2D, width: number, height: number) {
  context.lineWidth = 5;
  context.beginPath();
  for (let x = 40; x < width - 30; x += 30) context.lineTo(x, 58 + Math.sin(x / 32) * 10);
  context.stroke();
  for (const [x, y] of [[70, height - 72], [width - 78, 82]]) {
    context.beginPath(); context.arc(x, y, 22, 0, Math.PI * 2); context.stroke();
  }
}

function drawReceiptRules(context: CanvasRenderingContext2D, width: number, height: number) {
  context.setLineDash([4, 12]); context.lineWidth = 3;
  context.beginPath(); context.moveTo(30, 0); context.lineTo(30, height); context.moveTo(width - 30, 0); context.lineTo(width - 30, height); context.stroke();
}

function drawEditorialBlocks(context: CanvasRenderingContext2D, width: number, height: number) {
  context.globalAlpha = .65;
  context.fillRect(-20, 92, width * .42, 44);
  context.fillRect(width * .72, height - 90, width * .36, 34);
}

function drawPostcardMark(context: CanvasRenderingContext2D, width: number) {
  context.lineWidth = 4; context.strokeRect(width - 128, 28, 78, 74);
  context.beginPath(); context.arc(width - 89, 65, 25, 0, Math.PI * 2); context.stroke();
}

function drawGraphPaper(context: CanvasRenderingContext2D, width: number, height: number) {
  context.globalAlpha = .18; context.lineWidth = 2;
  for (let x = 0; x < width; x += 32) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
  for (let y = 0; y < height; y += 32) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
  context.globalAlpha = .5; context.fillRect(74, 0, 4, height);
}

function drawHalftone(context: CanvasRenderingContext2D, width: number, height: number) {
  for (let y = 20; y < height; y += 28) for (let x = 20; x < width; x += 28) {
    const radius = ((x + y) / 28) % 3 === 0 ? 4 : 2;
    context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
  }
}

function drawFrameCorners(context: CanvasRenderingContext2D, frame: PhotoFrame) {
  const d = 22;
  for (const [x, y, sx, sy] of [[frame.x, frame.y, 1, 1], [frame.x + frame.width, frame.y, -1, 1], [frame.x, frame.y + frame.height, 1, -1], [frame.x + frame.width, frame.y + frame.height, -1, -1]]) {
    context.beginPath(); context.moveTo(x + sx * d, y); context.lineTo(x, y); context.lineTo(x, y + sy * d); context.stroke();
  }
}

function drawInkNote(context: CanvasRenderingContext2D, frame: PhotoFrame, index: number) {
  context.save(); context.translate(frame.x + 18, frame.y + frame.height - 16); context.rotate(index % 2 ? -.03 : .03);
  context.textAlign = "left"; context.font = "italic 700 19px Georgia, serif"; context.fillText(["keep this", "again!", "too good", "04 / 04"][index % 4], 0, 0); context.restore();
}

function drawFrameSprockets(context: CanvasRenderingContext2D, frame: PhotoFrame) {
  context.globalAlpha = .75;
  for (let x = frame.x + 12; x < frame.x + frame.width - 10; x += 42) {
    context.fillRect(x, frame.y - 18, 22, 9); context.fillRect(x, frame.y + frame.height + 9, 22, 9);
  }
}

function drawTape(context: CanvasRenderingContext2D, frame: PhotoFrame, index: number) {
  context.save(); context.globalAlpha = .56; context.translate(frame.x + frame.width / 2, frame.y - 7); context.rotate(index % 2 ? .045 : -.045);
  context.fillRect(-64, -18, 128, 36); context.restore();
}

function drawPaperCorners(context: CanvasRenderingContext2D, frame: PhotoFrame, index: number) {
  context.globalAlpha = .62;
  context.save(); context.translate(frame.x - 8, frame.y + 22); context.rotate(-.7); context.fillRect(-8, -30, 16, 60); context.restore();
  if (index % 2) { context.beginPath(); context.arc(frame.x + frame.width - 18, frame.y + 20, 12, 0, Math.PI * 2); context.fill(); }
}

function drawPhotoCorners(context: CanvasRenderingContext2D, frame: PhotoFrame) {
  context.lineWidth = 12; context.globalAlpha = .64;
  drawFrameCorners(context, frame);
}

function drawNotebookNumber(context: CanvasRenderingContext2D, frame: PhotoFrame, index: number) {
  context.textAlign = "left"; context.font = "italic 700 24px Georgia, serif"; context.fillText(`0${index + 1}`, frame.x + 10, frame.y + 28);
}

function drawRoughUnderline(context: CanvasRenderingContext2D, frame: PhotoFrame, index: number) {
  context.globalAlpha = .75; context.lineWidth = 5 + (index % 2) * 3;
  context.beginPath(); context.moveTo(frame.x + 10, frame.y + frame.height + 7); context.lineTo(frame.x + frame.width - 4, frame.y + frame.height + 12); context.stroke();
}
