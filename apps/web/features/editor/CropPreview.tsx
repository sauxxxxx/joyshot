"use client";
import { useEffect, useRef } from "react";
import { drawImageCover } from "@/features/strip/photoLayouts";
import type { PhotoEdit } from "./photoEdits";

export function CropPreview({ edit, width, height, label }: { edit: PhotoEdit; width: number; height: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      const canvas = ref.current;
      if (!canvas || !active) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = Math.round(width); canvas.height = Math.round(height);
      drawImageCover(context, image, { x: 0, y: 0, width: canvas.width, height: canvas.height }, edit);
    };
    image.src = edit.source;
    return () => { active = false; };
  }, [edit, width, height]);
  return <canvas ref={ref} role="img" aria-label={label} style={{ display: "block", width: "100%", aspectRatio: width / height }} />;
}
