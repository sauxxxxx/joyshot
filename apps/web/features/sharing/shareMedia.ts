import { dataUrlToBlob } from "@/features/gallery/galleryStore";

export async function shareImage(dataUrl: string, filename: string, title: string) {
  const file = new File([await dataUrlToBlob(dataUrl)], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text: "Made with JoyShot" });
    return true;
  }
  return false;
}

export async function shareLink(url: string, title: string) {
  if (navigator.share) {
    await navigator.share({ title, text: "Join my private JoyShot booth", url });
    return "shared" as const;
  }
  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
