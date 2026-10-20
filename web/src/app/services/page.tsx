import type { Metadata } from "next";
import { ServicesView } from "@/components/demo/services-view";

export const metadata: Metadata = { title: "Services", description: "Gestion locative, déménagement, assainissement, maintenance et urgences à Douala." };
const TABS = ["prest", "metier", "offres", "logistique", "urgences"] as const;

export default async function Services({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t === sp.tab) ?? "prest";
  return <ServicesView initial={tab} metier={sp.m} pack={sp.p} />;
}
