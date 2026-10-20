import type { Metadata } from "next";
import { JuridiqueView } from "@/components/demo/juridique-view";

export const metadata: Metadata = { title: "Pôle juridique", description: "Étude des dossiers, pièces demandées, fonds de commerce et sécurité juridique." };

export default function Juridique() {
  return <JuridiqueView />;
}
