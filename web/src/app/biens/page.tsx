import type { Metadata } from "next";
import { Suspense } from "react";
import { BiensView } from "@/components/demo/biens-view";

export const metadata: Metadata = { title: "Biens à Douala", description: "Logements, bureaux, boutiques, terrains et fonds de commerce à Douala." };

export default function Biens() {
  return <Suspense><BiensView /></Suspense>;
}
