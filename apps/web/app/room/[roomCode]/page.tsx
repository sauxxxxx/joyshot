import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RoomBooth } from "@/features/room/RoomBooth";

interface RoomPageProps { params: Promise<{ roomCode: string }> }

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { roomCode } = await params;
  return { title: `Room ${roomCode.toUpperCase()}`, description: "A private two-person JoyShot photo booth." };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomCode } = await params;
  return <><SiteHeader /><main className="container"><RoomBooth roomCode={roomCode.toUpperCase()} /></main></>;
}
