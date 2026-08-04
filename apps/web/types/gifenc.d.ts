declare module "gifenc" {
  type Palette = number[][];
  interface FrameOptions { palette?: Palette; delay?: number; repeat?: number; }
  interface Encoder {
    writeFrame(index: Uint8Array, width: number, height: number, options?: FrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  }
  export function GIFEncoder(): Encoder;
  export function quantize(data: Uint8Array | Uint8ClampedArray, maxColors: number): Palette;
  export function applyPalette(data: Uint8Array | Uint8ClampedArray, palette: Palette): Uint8Array;
}
