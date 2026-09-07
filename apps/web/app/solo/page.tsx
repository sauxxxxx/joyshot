import type { Metadata } from "next";
import { SoloBooth } from "@/features/solo/SoloBooth";

export const metadata: Metadata = {
  title: "Solo Booth",
  description: "Take four photos and create a private photo strip in your browser.",
};

export default function SoloPage() {
  return (
    <>
      <a className="skipLink" href="#solo-main">Skip to the booth</a>
      <SoloBooth />
    </>
  );
}
