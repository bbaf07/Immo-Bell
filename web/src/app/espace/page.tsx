import type { Metadata } from "next";
import { EspaceView } from "@/components/demo/espace-view";

export const metadata: Metadata = { title: "Mon espace", description: "Suivez vos demandes, documents, messages et signalements Immo Bell." };

export default function Espace() {
  return <EspaceView />;
}
